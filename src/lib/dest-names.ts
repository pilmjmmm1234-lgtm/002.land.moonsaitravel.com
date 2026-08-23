/** Display / match aliases for Drive folder typos. */
const DEST_NAME_ALIASES: Record<string, string> = {
  koera: "Korea",
  korea: "Korea",
  eglpt: "Egypt",
  egypt: "Egypt",
};

export function displayDestName(name: string): string {
  const n = name.trim();
  if (!n) return n;
  return DEST_NAME_ALIASES[n.toLowerCase()] ?? n;
}

export function normalizeDestKey(value: string): string {
  const n = value.trim().toLowerCase();
  return (DEST_NAME_ALIASES[n] ?? n).toLowerCase();
}

export function displayFolderName(name: string): string {
  const n = displayDestName(name).replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return n;
}

export function destMatches(
  dest: { id?: string; name?: string },
  needle: string,
): boolean {
  const id = dest.id?.trim() ?? "";
  if (id && id === needle) return true;
  const a = normalizeDestKey(dest.name ?? "");
  const b = normalizeDestKey(needle);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function extractDriveFolderId(url: string): string {
  const u = url.trim();
  if (!u) return "";
  const folder = u.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folder?.[1]) return folder[1];
  const idParam = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam?.[1]) return idParam[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(u)) return u;
  return "";
}
