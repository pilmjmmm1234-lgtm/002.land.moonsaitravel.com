/**
 * Web display variants vs Drive originals.
 * Drive keeps full-quality masters; this app only requests sized WebP copies.
 *
 * thumb/card — first paint & grids (800–1200px)
 * hero       — home main slideshow (fast first paint ~1200px)
 * story      — Travel Story detail only (2K / 2560)
 */
export const IMAGE_WIDTH = {
  /** Destination / story cards */
  card: 1000,
  /** Home full-bleed background (~2K web) */
  hero: 2048,
  /** Story / fullscreen only */
  story: 2560,
  storyMax: 2560,
} as const;

/** WebP quality by role */
export const IMAGE_QUALITY = {
  card: 82,
  hero: 88,
  story: 90,
  storyMax: 90,
} as const;

export type ImageWidthPreset = keyof typeof IMAGE_WIDTH;

/** Build or upgrade a proxy URL with max long-edge + quality. */
export function withImageWidth(
  src: string,
  width: number,
  quality?: number,
): string {
  const w = Math.max(1, Math.min(2560, Math.round(width)));
  if (!src) return src;

  const q =
    quality !== undefined
      ? Math.max(60, Math.min(95, Math.round(quality)))
      : undefined;

  if (src.startsWith("/api/drive/main-screen/image")) {
    try {
      const u = new URL(src, "http://local.invalid");
      u.searchParams.set("w", String(w));
      if (q !== undefined) u.searchParams.set("q", String(q));
      return `${u.pathname}?${u.searchParams.toString()}`;
    } catch {
      return src;
    }
  }

  if (
    src.includes("drive.google.com") ||
    src.includes("googleusercontent.com")
  ) {
    const base = `/api/drive/main-screen/image?src=${encodeURIComponent(src)}&w=${w}`;
    return q !== undefined ? `${base}&q=${q}` : base;
  }

  return src;
}

export function driveImageProxy(
  rawUrl: string,
  preset: ImageWidthPreset = "card",
): string {
  const src = rawUrl.trim();
  if (!src) return src;
  if (src.startsWith("/api/") || src.startsWith("/destinations/") || src.startsWith("/images/")) {
    return withImageWidth(src, IMAGE_WIDTH[preset], IMAGE_QUALITY[preset]);
  }
  return withImageWidth(
    `/api/drive/main-screen/image?src=${encodeURIComponent(src)}`,
    IMAGE_WIDTH[preset],
    IMAGE_QUALITY[preset],
  );
}

export function extractDriveFileId(src: string): string | null {
  try {
    const u = new URL(src);
    const idParam = u.searchParams.get("id")?.trim();
    if (idParam) return idParam;
    const m = u.pathname.match(/\/d\/([^/]+)/);
    if (m?.[1]) return m[1];
    const m2 = u.pathname.match(/\/d\/([^/?#]+)/);
    if (m2?.[1]) return m2[1];
  } catch {
    /* ignore */
  }
  return null;
}
