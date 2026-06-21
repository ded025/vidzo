import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedContentPack, ReferenceAsset } from "@/lib/content-pack";

const MAX_ASSETS = 3;
const MAX_IMAGE_BYTES = 2_500_000;
const FETCH_TIMEOUT_MS = 2_500;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local") ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function extractMetaUrl(html: string, baseUrl: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]+href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1];
    if (!match) continue;
    try {
      return new URL(decodeHtml(match), baseUrl).toString();
    } catch {
      continue;
    }
  }
  return null;
}

function extractRequestUrls(userRequest: string) {
  return Array.from(userRequest.matchAll(/https?:\/\/[^\s<>"')\]]+/g), (match) => match[0]);
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Vidzo/1.0 (+https://vidzo.in)" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function findReferenceImage(sourceUrl: string) {
  if (!isPublicHttpUrl(sourceUrl)) return null;
  if (/\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(sourceUrl)) {
    return { imageUrl: sourceUrl, type: "thumbnail" as const };
  }

  const pageResponse = await fetchWithTimeout(sourceUrl);
  if (!pageResponse.ok || !isPublicHttpUrl(pageResponse.url)) return null;
  const contentType = pageResponse.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return null;
  const html = (await pageResponse.text()).slice(0, 500_000);
  const imageUrl = extractMetaUrl(html, pageResponse.url);
  if (!imageUrl || !isPublicHttpUrl(imageUrl)) return null;
  return {
    imageUrl,
    type: /(?:logo|icon|favicon)/i.test(imageUrl) ? ("logo" as const) : ("thumbnail" as const),
  };
}

async function cacheImage(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string,
  sourceUrl: string,
) {
  try {
    const imageResponse = await fetchWithTimeout(imageUrl);
    if (!imageResponse.ok || !isPublicHttpUrl(imageResponse.url)) return imageUrl;
    const contentType = imageResponse.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return imageUrl;
    const contentLength = Number(imageResponse.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) return imageUrl;

    const bytes = await imageResponse.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) return imageUrl;
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const digest = createHash("sha256")
      .update(`${sourceUrl}:${imageUrl}`)
      .digest("hex")
      .slice(0, 24);
    const path = `${userId}/${digest}.${extension}`;
    await supabase.storage
      .from("reference-assets")
      .upload(path, bytes, { contentType, cacheControl: "86400", upsert: false });
    return supabase.storage.from("reference-assets").getPublicUrl(path).data.publicUrl || imageUrl;
  } catch {
    return imageUrl;
  }
}

export async function resolveReferenceAssets({
  supabase,
  userId,
  pack,
  userRequest,
}: {
  supabase: SupabaseClient;
  userId: string;
  pack: GeneratedContentPack;
  userRequest: string;
}) {
  const candidates = [
    ...extractRequestUrls(userRequest).map((url) => ({
      url,
      label: new URL(url).hostname.replace(/^www\./, ""),
    })),
    ...pack.sources.map((source) => ({
      url: source.url,
      label: source.publisher || new URL(source.url).hostname.replace(/^www\./, ""),
    })),
  ];

  const unique = Array.from(new Map(candidates.map((item) => [item.url, item])).values()).slice(
    0,
    MAX_ASSETS,
  );
  const assets = await Promise.all(
    unique.map(async ({ url, label }): Promise<ReferenceAsset | null> => {
      try {
        const reference = await findReferenceImage(url);
        if (!reference) return null;
        const cachedUrl = await cacheImage(supabase, userId, reference.imageUrl, url);
        return {
          id: createHash("sha1").update(url).digest("hex").slice(0, 12),
          label,
          type: reference.type,
          imageUrl: cachedUrl,
          sourceUrl: url,
          sourceName: label,
        };
      } catch {
        return null;
      }
    }),
  );

  return assets.filter((asset): asset is ReferenceAsset => asset !== null);
}
