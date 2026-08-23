import { extractDriveFileId } from "@/lib/image-proxy";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function isHtmlType(type: string): boolean {
  const t = type.toLowerCase();
  return t.includes("text/html") || t.includes("application/json") || t.includes("text/plain");
}

function isMediaType(type: string): boolean {
  const t = type.toLowerCase();
  if (!t) return false;
  if (isHtmlType(t)) return false;
  return (
    t.startsWith("video/") ||
    t.startsWith("audio/") ||
    t.includes("octet-stream") ||
    t.includes("mp4") ||
    t.includes("webm")
  );
}

function extractConfirm(html: string): { confirm: string; uuid: string } {
  const confirm =
    html.match(/name=["']confirm["']\s+value=["']([^"']+)["']/i)?.[1] ||
    html.match(/[?&]confirm=([0-9A-Za-z_-]+)/)?.[1] ||
    "t";
  const uuid =
    html.match(/name=["']uuid["']\s+value=["']([^"']+)["']/i)?.[1] ||
    html.match(/[?&]uuid=([0-9A-Za-z_-]+)/)?.[1] ||
    "";
  return { confirm, uuid };
}

function videoHeaders(upstream: Response): Headers {
  const type = (upstream.headers.get("content-type") || "").toLowerCase();
  const out = new Headers();
  out.set(
    "Content-Type",
    type.startsWith("video/") ? type.split(";")[0]! : "video/mp4",
  );
  out.set("Cache-Control", "public, max-age=120");
  out.set("Accept-Ranges", "bytes");
  out.set("Content-Disposition", "inline");
  const len = upstream.headers.get("content-length");
  if (len) out.set("Content-Length", len);
  const cr = upstream.headers.get("content-range");
  if (cr) out.set("Content-Range", cr);
  return out;
}

async function fetchCandidate(
  url: string,
  range: string | null,
  cookie = "",
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "video/mp4,video/webm,video/*,*/*",
    "User-Agent": UA,
  };
  if (range) headers.Range = range;
  if (cookie) headers.Cookie = cookie;
  return fetch(url, { redirect: "follow", headers });
}

/**
 * Public Drive video download. Bypasses the virus-scan HTML interstitial
 * that blocks uc?export=download for many MP4 files.
 */
export async function streamPublicDriveVideo(
  fileId: string,
  range: string | null = null,
): Promise<Response> {
  const id = fileId.trim();
  if (!id) return new Response("Invalid file id", { status: 400 });

  const candidates = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}&confirm=t`,
    `https://drive.google.com/uc?id=${encodeURIComponent(id)}&export=download`,
  ];

  for (const url of candidates) {
    try {
      let res = await fetchCandidate(url, range);
      let type = res.headers.get("content-type") || "";

      if (res.body && res.ok && isMediaType(type)) {
        return new Response(res.body, {
          status: res.status,
          headers: videoHeaders(res),
        });
      }

      if (res.ok && isHtmlType(type)) {
        const html = await res.text();
        if (!/confirm=|download-form|virus|uc-download/i.test(html)) continue;
        const { confirm, uuid } = extractConfirm(html);
        const retry = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=${encodeURIComponent(confirm)}${uuid ? `&uuid=${encodeURIComponent(uuid)}` : ""}`;
        res = await fetchCandidate(retry, range);
        type = res.headers.get("content-type") || "";
        if (res.body && (res.ok || res.status === 206) && isMediaType(type)) {
          return new Response(res.body, {
            status: res.status,
            headers: videoHeaders(res),
          });
        }
      }
    } catch {
      /* try next */
    }
  }

  try {
    const { streamGoogleDriveFile } = await import("@/lib/drive/client.server");
    return await streamGoogleDriveFile(id);
  } catch {
    /* no API key */
  }

  return new Response("Upstream video failed", { status: 502 });
}

export function driveIdFromStreamRequest(request: Request): string | null {
  const u = new URL(request.url);
  const id = u.searchParams.get("id")?.trim();
  if (id) return id;
  const src = u.searchParams.get("src")?.trim() || "";
  if (!src) return null;
  return extractDriveFileId(src);
}
