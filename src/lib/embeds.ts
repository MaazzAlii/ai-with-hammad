/**
 * Video/social embed parsing. Embed URLs are ALWAYS derived from a parsed,
 * allow-listed provider URL — never taken verbatim from user input, and raw
 * iframe HTML is never stored.
 */
export type EmbedProvider = "youtube" | "vimeo" | "tiktok" | "instagram" | "facebook" | "linkedin";

export type Embed = {
  provider: EmbedProvider;
  id: string;
  embedUrl: string;
  /** Thumbnail we can derive without any API call (YouTube only). */
  thumbnailUrl: string | null;
  /** Vertical (9:16) vs landscape (16:9). */
  aspect: "landscape" | "portrait" | "square";
};

function parse(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

const host = (u: URL) => u.hostname.toLowerCase().replace(/^www\.|^m\./, "");
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTube(input: string): Embed | null {
  const u = parse(input);
  if (!u) return null;
  const h = host(u);
  let id: string | null = null;
  if (h === "youtu.be") id = u.pathname.slice(1).split("/")[0] ?? null;
  else if (h === "youtube.com" || h === "youtube-nocookie.com" || h === "music.youtube.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  if (!id || !YT_ID.test(id)) return null;
  const isShort = u.pathname.startsWith("/shorts/");
  const start = Number.parseInt(u.searchParams.get("t") ?? u.searchParams.get("start") ?? "", 10);
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (Number.isFinite(start) && start > 0) params.set("start", String(start));
  return {
    provider: "youtube",
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    aspect: isShort ? "portrait" : "landscape",
  };
}

export function parseVimeo(input: string): Embed | null {
  const u = parse(input);
  if (!u) return null;
  const h = host(u);
  if (h !== "vimeo.com" && h !== "player.vimeo.com") return null;
  const m = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/([0-9a-f]{6,20}))?(?:\/|$)/);
  if (!m) return null;
  const id = m[1]!;
  const hash = m[2] ?? u.searchParams.get("h");
  const params = new URLSearchParams({ dnt: "1" });
  if (hash && /^[0-9a-f]{6,20}$/.test(hash)) params.set("h", hash);
  return { provider: "vimeo", id, embedUrl: `https://player.vimeo.com/video/${id}?${params}`, thumbnailUrl: null, aspect: "landscape" };
}

export function parseTikTok(input: string): Embed | null {
  const u = parse(input);
  if (!u || host(u) !== "tiktok.com") return null;
  const m = u.pathname.match(/\/video\/(\d{8,25})/);
  if (!m) return null;
  return { provider: "tiktok", id: m[1]!, embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}`, thumbnailUrl: null, aspect: "portrait" };
}

export function parseInstagram(input: string): Embed | null {
  const u = parse(input);
  if (!u || host(u) !== "instagram.com") return null;
  const m = u.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]{5,40})/);
  if (!m) return null;
  return { provider: "instagram", id: m[2]!, embedUrl: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, thumbnailUrl: null, aspect: m[1] === "p" ? "square" : "portrait" };
}

export function parseFacebook(input: string): Embed | null {
  const u = parse(input);
  if (!u || !["facebook.com", "fb.watch"].includes(host(u))) return null;
  const href = `https://www.facebook.com${u.pathname}`;
  if (!/\/(videos|reel|watch)\b/.test(u.pathname) && host(u) !== "fb.watch") return null;
  return {
    provider: "facebook",
    id: u.pathname,
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(host(u) === "fb.watch" ? u.toString() : href)}&show_text=false`,
    thumbnailUrl: null,
    aspect: "landscape",
  };
}

export function parseLinkedIn(input: string): Embed | null {
  const u = parse(input);
  if (!u || host(u) !== "linkedin.com") return null;
  const m = u.pathname.match(/urn:li:(activity|share|ugcPost):(\d{10,25})/) ?? u.pathname.match(/activity-(\d{10,25})/);
  if (!m) return null;
  const [type, id] = m.length === 3 ? [m[1]!, m[2]!] : ["activity", m[1]!];
  return { provider: "linkedin", id, embedUrl: `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}`, thumbnailUrl: null, aspect: "portrait" };
}

/** Try every provider. Returns null for anything not on the allow-list. */
export function parseEmbed(input: string | null | undefined): Embed | null {
  if (!input) return null;
  return (
    parseYouTube(input) ??
    parseVimeo(input) ??
    parseTikTok(input) ??
    parseInstagram(input) ??
    parseFacebook(input) ??
    parseLinkedIn(input)
  );
}

export function parseVideoEmbed(input: string | null | undefined): Embed | null {
  if (!input) return null;
  return parseYouTube(input) ?? parseVimeo(input);
}
