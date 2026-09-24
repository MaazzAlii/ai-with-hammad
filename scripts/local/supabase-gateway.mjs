#!/usr/bin/env node
/**
 * LOCAL TEST INFRASTRUCTURE ONLY — never deployed.
 *
 * A tiny stand-in for the Supabase API gateway, used because Docker images for
 * `supabase start` are unavailable in the development sandbox:
 *
 *   /auth/v1/*     → proxied to a real GoTrue (Supabase Auth) server
 *   /storage/v1/*  → minimal Storage API emulator that
 *                     - verifies the caller's JWT (HS256, same secret as GoTrue)
 *                     - enforces bucket file_size_limit / allowed_mime_types
 *                     - writes storage.objects rows AS THE CALLER'S ROLE with
 *                       request.jwt.claims set, so the real RLS policies from
 *                       supabase/AI_WITH_HAMAD_SETUP.sql are enforced
 *                     - stores bytes on local disk
 *
 * Env: GATEWAY_PORT (54321), GOTRUE_URL (http://127.0.0.1:9999),
 *      JWT_SECRET, GATEWAY_DATABASE_URL, STORAGE_DIR.
 * Not implemented: TUS resumable uploads, image transforms, signed URLs.
 */
import { createReadStream, createWriteStream, mkdirSync, rmSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import jwt from "jsonwebtoken";
import postgres from "postgres";

const PORT = Number(process.env.GATEWAY_PORT ?? 54321);
const GOTRUE_URL = process.env.GOTRUE_URL ?? "http://127.0.0.1:9999";
const JWT_SECRET = process.env.JWT_SECRET ?? "local-dev-jwt-secret-at-least-32-characters-long";
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR ?? ".tmp/storage");
const sql = postgres(process.env.GATEWAY_DATABASE_URL ?? "postgres://postgres@127.0.0.1:54322/postgres", { max: 5, onnotice: () => {} });

mkdirSync(STORAGE_DIR, { recursive: true });

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-upsert, cache-control, x-metadata, tus-resumable, upload-length, upload-metadata, upload-offset",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
  "access-control-expose-headers": "content-length, content-type, etag, location, upload-offset",
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", ...CORS, ...headers });
  res.end(payload);
}

function claimsFrom(req) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers.apikey;
  if (!token) return null;
  try {
    return jwt.verify(String(token), JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}

/** Run fn inside a transaction as the JWT's role, like PostgREST / storage-api do. */
async function asCaller(claims, fn) {
  const role = claims.role === "service_role" ? "service_role" : claims.role === "authenticated" ? "authenticated" : "anon";
  return sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`;
    await tx.unsafe(`set local role ${role}`);
    return fn(tx);
  });
}

const safeKey = (key) => key && !key.includes("..") && !key.startsWith("/") && !key.includes("\0");
const filePath = (bucket, key) => path.join(STORAGE_DIR, bucket, key);

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

async function extractUpload(req) {
  const type = req.headers["content-type"] ?? "application/octet-stream";
  const raw = await readBody(req);
  if (type.startsWith("multipart/form-data")) {
    const form = await new Response(raw, { headers: { "content-type": type } }).formData();
    for (const [, value] of form.entries()) {
      if (typeof value === "object" && "arrayBuffer" in value) {
        return { bytes: Buffer.from(await value.arrayBuffer()), mimetype: value.type || "application/octet-stream" };
      }
    }
    throw Object.assign(new Error("No file in form data"), { status: 400 });
  }
  return { bytes: raw, mimetype: type.split(";")[0].trim() };
}

async function handleUpload(req, res, bucket, key, isUpdate) {
  const claims = claimsFrom(req);
  if (!claims) return send(res, 403, { statusCode: "403", error: "Unauthorized", message: "Invalid JWT" });
  if (!safeKey(key)) return send(res, 400, { statusCode: "400", error: "InvalidKey", message: "Invalid key" });
  const [b] = await sql`select id, file_size_limit, allowed_mime_types from storage.buckets where id = ${bucket}`;
  if (!b) return send(res, 404, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
  const { bytes, mimetype } = await extractUpload(req);
  if (b.file_size_limit && bytes.length > Number(b.file_size_limit)) {
    return send(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
  }
  if (b.allowed_mime_types?.length && !b.allowed_mime_types.includes(mimetype)) {
    return send(res, 415, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${mimetype} is not supported` });
  }
  const upsert = req.headers["x-upsert"] === "true" || isUpdate;
  const metadata = { size: bytes.length, mimetype, eTag: `"${bytes.length}-${Date.now()}"`, cacheControl: "max-age=3600", contentLength: bytes.length, httpStatusCode: 200, lastModified: new Date().toISOString() };
  try {
    const row = await asCaller(claims, async (tx) => {
      if (isUpdate) {
        const r = await tx`update storage.objects set metadata = ${tx.json(metadata)}, updated_at = now() where bucket_id = ${bucket} and name = ${key} returning id`;
        if (!r.length) throw Object.assign(new Error("Object not found"), { status: 404 });
        return r[0];
      }
      const r = upsert
        ? await tx`insert into storage.objects (bucket_id, name, owner, owner_id, metadata) values (${bucket}, ${key}, ${claims.sub ?? null}, ${claims.sub ?? null}, ${tx.json(metadata)})
                   on conflict (bucket_id, name) do update set metadata = excluded.metadata, updated_at = now() returning id`
        : await tx`insert into storage.objects (bucket_id, name, owner, owner_id, metadata) values (${bucket}, ${key}, ${claims.sub ?? null}, ${claims.sub ?? null}, ${tx.json(metadata)}) returning id`;
      return r[0];
    });
    const fp = filePath(bucket, key);
    mkdirSync(path.dirname(fp), { recursive: true });
    await pipeline(Readable.from(bytes), createWriteStream(fp));
    return send(res, 200, { Id: row.id, Key: `${bucket}/${key}` });
  } catch (e) {
    if (e.status) return send(res, e.status, { statusCode: String(e.status), error: e.message, message: e.message });
    if (e.code === "23505") return send(res, 409, { statusCode: "409", error: "Duplicate", message: "The resource already exists" });
    if (/row-level security/.test(e.message)) return send(res, 403, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" });
    console.error(e);
    return send(res, 500, { statusCode: "500", error: "internal", message: e.message });
  }
}

async function handleDelete(req, res, bucket) {
  const claims = claimsFrom(req);
  if (!claims) return send(res, 403, { statusCode: "403", error: "Unauthorized", message: "Invalid JWT" });
  const body = JSON.parse((await readBody(req)).toString() || "{}");
  const prefixes = Array.isArray(body.prefixes) ? body.prefixes.filter(safeKey) : [];
  const deleted = await asCaller(claims, (tx) =>
    tx`delete from storage.objects where bucket_id = ${bucket} and name = any(${prefixes}) returning id, name, bucket_id, metadata`,
  );
  for (const d of deleted) rmSync(filePath(bucket, d.name), { force: true });
  return send(res, 200, deleted.map((d) => ({ name: d.name, bucket_id: d.bucket_id, id: d.id, metadata: d.metadata })));
}

async function handleMove(req, res) {
  const claims = claimsFrom(req);
  if (!claims) return send(res, 403, { statusCode: "403", error: "Unauthorized", message: "Invalid JWT" });
  const { bucketId, sourceKey, destinationKey } = JSON.parse((await readBody(req)).toString() || "{}");
  if (!safeKey(sourceKey) || !safeKey(destinationKey)) return send(res, 400, { message: "Invalid key" });
  const moved = await asCaller(claims, (tx) => tx`update storage.objects set name = ${destinationKey} where bucket_id = ${bucketId} and name = ${sourceKey} returning id`);
  if (!moved.length) return send(res, 404, { message: "Object not found" });
  const src = filePath(bucketId, sourceKey);
  const dst = filePath(bucketId, destinationKey);
  mkdirSync(path.dirname(dst), { recursive: true });
  await pipeline(createReadStream(src), createWriteStream(dst));
  rmSync(src, { force: true });
  return send(res, 200, { message: "Successfully moved" });
}

async function handlePublic(req, res, bucket, key) {
  const [b] = await sql`select public from storage.buckets where id = ${bucket}`;
  if (!b?.public || !safeKey(key)) return send(res, 400, { statusCode: "404", error: "not_found", message: "Object not found" });
  const [o] = await sql`select metadata from storage.objects where bucket_id = ${bucket} and name = ${key}`;
  const fp = filePath(bucket, key);
  let size;
  try {
    size = statSync(fp).size;
  } catch {
    return send(res, 400, { statusCode: "404", error: "not_found", message: "Object not found" });
  }
  res.writeHead(200, { ...CORS, "content-type": o?.metadata?.mimetype ?? "application/octet-stream", "content-length": size, "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" });
  if (req.method === "HEAD") return res.end();
  createReadStream(fp).pipe(res);
}

async function proxyAuth(req, res, rest) {
  const target = new URL(rest + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""), GOTRUE_URL);
  const headers = { ...req.headers };
  delete headers.host;
  delete headers["content-length"];
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
  const r = await fetch(target, { method: req.method, headers, body, redirect: "manual" });
  const out = { ...CORS };
  r.headers.forEach((v, k) => {
    if (!["content-encoding", "transfer-encoding", "connection", "content-length"].includes(k)) out[k] = v;
  });
  res.writeHead(r.status, out);
  res.end(Buffer.from(await r.arrayBuffer()));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, "");
    const url = new URL(req.url, "http://gateway");
    const p = decodeURIComponent(url.pathname);
    if (p === "/health") return send(res, 200, { ok: true });
    if (p.startsWith("/auth/v1/")) return await proxyAuth(req, res, p.slice("/auth/v1".length));
    if (p.startsWith("/storage/v1/upload/resumable")) return send(res, 501, { message: "Resumable uploads are not supported by the local emulator" });
    if (p === "/storage/v1/object/move" && req.method === "POST") return await handleMove(req, res);
    let m = p.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (m && (req.method === "GET" || req.method === "HEAD")) return await handlePublic(req, res, m[1], m[2]);
    m = p.match(/^\/storage\/v1\/object\/([^/]+)\/?$/);
    if (m && req.method === "DELETE") return await handleDelete(req, res, m[1]);
    m = p.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/);
    if (m && (req.method === "POST" || req.method === "PUT")) return await handleUpload(req, res, m[1], m[2], req.method === "PUT");
    return send(res, 404, { message: `No route for ${req.method} ${p}` });
  } catch (e) {
    console.error("[gateway]", e);
    if (!res.headersSent) send(res, 500, { message: "gateway error" });
  }
});

server.listen(PORT, "127.0.0.1", () => console.log(`[gateway] listening on http://127.0.0.1:${PORT}`));
