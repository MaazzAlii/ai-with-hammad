#!/usr/bin/env node
// Prints local-only anon and service_role JWTs signed with the local GoTrue secret.
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "local-dev-jwt-secret-at-least-32-characters-long";
const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 5;
const sign = (role) => jwt.sign({ iss: "supabase-local", role, exp }, secret, { algorithm: "HS256" });
const which = process.argv[2];
if (which === "anon") console.log(sign("anon"));
else if (which === "service") console.log(sign("service_role"));
else console.log(`ANON=${sign("anon")}\nSERVICE=${sign("service_role")}`);
