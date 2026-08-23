const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function kindFromName(name: string): "image" | "video" | null {
  const ext = extOf(name);
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  return null;
}

export function kindFromMime(mime: string, name: string): "image" | "video" | null {
  if (IMAGE_MIME.has(mime) || mime.startsWith("image/")) return "image";
  if (VIDEO_MIME.has(mime) || mime.startsWith("video/")) return "video";
  return kindFromName(name);
}

export function isSupportedMedia(name: string, mime?: string): boolean {
  if (mime) return kindFromMime(mime, name) !== null;
  return kindFromName(name) !== null;
}

export function isPlayableVideoSrc(src: string): boolean {
  const s = src.trim().toLowerCase();
  if (!s) return false;
  if (s.includes("/api/travel-lifestyle/stream")) return true;
  if (s.includes("/api/drive/file/")) return true;
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/.test(s);
}

export function drivePreviewEmbed(id: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
}
