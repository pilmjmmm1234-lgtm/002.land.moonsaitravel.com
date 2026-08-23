import { createFileRoute } from "@tanstack/react-router";
import sharp from "sharp";
import { extractDriveFileId } from "@/lib/image-proxy";

/**
 * Web-optimized image proxy.
 * - Never writes back to Google Drive (originals untouched)
 * - Resizes by long edge (?w=) and encodes WebP (?q= quality)
 * - Falls back to upstream bytes if transform fails
 */
export const Route = createFileRoute("/api/drive/main-screen/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const src = u.searchParams.get("src")?.trim() || "";
        if (!src) {
          return new Response("Missing src", { status: 400 });
        }

        let parsed: URL;
        try {
          parsed = new URL(src);
        } catch {
          return new Response("Invalid src", { status: 400 });
        }

        const host = parsed.hostname.toLowerCase();
        const allowed =
          host === "drive.google.com" ||
          host === "drive.usercontent.google.com" ||
          host.endsWith(".googleusercontent.com");
        if (!allowed) {
          return new Response("Host not allowed", { status: 400 });
        }

        const wRaw = u.searchParams.get("w");
        const w = wRaw
          ? Math.max(120, Math.min(2560, parseInt(wRaw, 10) || 0))
          : 1200;

        const qRaw = u.searchParams.get("q");
        const q = qRaw
          ? Math.max(60, Math.min(95, parseInt(qRaw, 10) || 88))
          : w <= 1200
            ? 85
            : 90;

        const candidates: string[] = [];
        const fileId = extractDriveFileId(src);

        // Prefer a high enough source for sharp (fetch near target size or larger)
        if (fileId) {
          const fetchTier = w <= 1200 ? [1600, 2000, 2560] : [2560, 2000];
          for (const tier of fetchTier) {
            candidates.push(
              `https://drive.google.com/thumbnail?id=${fileId}&sz=w${tier}`,
            );
          }
          candidates.push(`https://lh3.googleusercontent.com/d/${fileId}=s${Math.min(w * 2, 4096)}`);
          candidates.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
          candidates.push(`https://drive.google.com/uc?export=download&id=${fileId}`);
        }
        candidates.push(src);
        if (src.includes("export=download")) {
          candidates.push(src.replace("export=download", "export=view"));
        }

        const unique = [...new Set(candidates)];

        try {
          for (const candidate of unique) {
            const res = await fetch(candidate, {
              redirect: "follow",
              headers: {
                Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            if (!res.ok) continue;

            const type = res.headers.get("content-type") || "";
            if (type && !type.startsWith("image/")) continue;

            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.byteLength < 32) continue;

            // Optimized web copy (ratio preserved, long edge capped)
            try {
              const webp = await sharp(buf, { failOn: "none" })
                .rotate()
                .resize({
                  width: w,
                  height: w,
                  fit: "inside",
                  withoutEnlargement: true,
                })
                .webp({ quality: q, effort: 4 })
                .toBuffer();

              const headers = new Headers();
              headers.set("Content-Type", "image/webp");
              headers.set(
                "Cache-Control",
                "public, max-age=86400, stale-while-revalidate=604800",
              );
              headers.set("X-Image-Width", String(w));
              headers.set("X-Image-Quality", String(q));
              headers.set("X-Image-Variant", "webp-web");
              headers.set("Content-Length", String(webp.byteLength));

              return new Response(new Uint8Array(webp), {
                status: 200,
                headers,
              });
            } catch {
              // Return original bytes if transform fails
              const headers = new Headers();
              headers.set(
                "Content-Type",
                type.startsWith("image/") ? type : "image/jpeg",
              );
              headers.set(
                "Cache-Control",
                "public, max-age=86400, stale-while-revalidate=604800",
              );
              headers.set("Content-Length", String(buf.byteLength));
              return new Response(new Uint8Array(buf), {
                status: 200,
                headers,
              });
            }
          }

          return new Response("Upstream image failed", { status: 502 });
        } catch {
          return new Response("Proxy error", { status: 502 });
        }
      },
    },
  },
});
