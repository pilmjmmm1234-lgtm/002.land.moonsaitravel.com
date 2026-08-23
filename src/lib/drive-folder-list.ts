export type DriveChild = {
  id: string;
  name: string;
  mime: string;
};

export const FOLDER_MIME = "application/vnd.google-apps.folder";

const childCache = new Map<string, { at: number; items: DriveChild[] }>();
const CHILD_TTL_MS = 60_000;

function decodeDriveEscapes(html: string): string {
  return html
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
      String.fromCharCode(Number.parseInt(h, 16)),
    )
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
      String.fromCharCode(Number.parseInt(h, 16)),
    )
    .replace(/\\"/g, '"');
}

function isImageName(name: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif|bmp|heic)$/i.test(name.trim());
}

function isVideoName(name: string): boolean {
  return /\.(mp4|webm|mov|m4v)$/i.test(name.trim());
}

function guessMime(name: string, hinted = ""): string {
  if (hinted.startsWith("image/") || hinted.startsWith("video/") || hinted === FOLDER_MIME) {
    return hinted;
  }
  if (isImageName(name)) {
    if (/\.png$/i.test(name)) return "image/png";
    if (/\.webp$/i.test(name)) return "image/webp";
    if (/\.gif$/i.test(name)) return "image/gif";
    return "image/jpeg";
  }
  if (isVideoName(name)) {
    if (/\.webm$/i.test(name)) return "video/webm";
    return "video/mp4";
  }
  return hinted || "application/octet-stream";
}

function addChild(
  map: Map<string, DriveChild>,
  id: string,
  name: string,
  mime = "",
) {
  const cleanId = id.trim();
  const cleanName = name.replace(/\u00a0/g, " ").trim();
  if (!cleanId || cleanId.length < 16 || !cleanName) return;
  const nextMime = guessMime(cleanName, mime);
  const prev = map.get(cleanId);
  if (prev) {
    const prevRank =
      prev.mime.startsWith("video/") || prev.mime.startsWith("image/") ? 2 : 1;
    const nextRank =
      nextMime.startsWith("video/") || nextMime.startsWith("image/") ? 2 : 1;
    const betterName = isVideoName(cleanName) || isImageName(cleanName);
    const prevNamed = isVideoName(prev.name) || isImageName(prev.name);
    if (nextRank < prevRank && !betterName) return;
    if (nextRank === prevRank && prevNamed && !betterName) return;
  }
  map.set(cleanId, {
    id: cleanId,
    name: cleanName,
    mime: nextMime,
  });
}

function parseDriveHtml(html: string): DriveChild[] {
  const decoded = decodeDriveEscapes(html);
  const map = new Map<string, DriveChild>();

  const rePairs = [
    /\["([A-Za-z0-9_-]{16,})",\["[A-Za-z0-9_-]+"\],"([^"]+)","([^"]+)"/g,
    /\["([A-Za-z0-9_-]{16,})"\s*,\s*(?:null|\[[^\]]*\])\s*,\s*"([^"]{1,240})"\s*,\s*"(application\/[^"]+|image\/[^"]+|video\/[^"]+)"/g,
  ];
  for (const re of rePairs) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(decoded))) {
      addChild(map, m[1]!, m[2]!, m[3] || "");
    }
  }

  const entryRe =
    /id="entry-([A-Za-z0-9_-]{16,})"[^>]*title="([^"]+)"|title="([^"]+)"[^>]*id="entry-([A-Za-z0-9_-]{16,})"/g;
  let e: RegExpExecArray | null;
  while ((e = entryRe.exec(html))) {
    const id = e[1] || e[4] || "";
    const name = e[2] || e[3] || "";
    addChild(map, id, name);
  }

  const fileRe =
    /href="https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{16,})[^"]*"[^>]*aria-label="([^"]+)"/gi;
  while ((e = fileRe.exec(html))) {
    addChild(map, e[1]!, e[2]!);
  }

  const folderLinkRe =
    /href="https:\/\/drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]{16,})[^"]*"[^>]*(?:aria-label|title)="([^"]+)"/gi;
  while ((e = folderLinkRe.exec(html))) {
    addChild(map, e[1]!, e[2]!, FOLDER_MIME);
  }

  const dataIdRe = /data-id="([A-Za-z0-9_-]{16,})"[^>]*aria-label="([^"]+)"/gi;
  while ((e = dataIdRe.exec(html))) {
    addChild(map, e[1]!, e[2]!);
  }

  const videoNameRe =
    /\/file\/d\/([A-Za-z0-9_-]{16,})[^"]{0,80}"[^>]{0,400}(?:aria-label|title)="([^"]+\.(?:mp4|webm|mov|m4v)[^"]*)"/gi;
  while ((e = videoNameRe.exec(html))) {
    addChild(map, e[1]!, e[2]!, "video/mp4");
  }

  const videoMimeRe =
    /"([A-Za-z0-9_-]{16,})"[\s\S]{0,220}"(video\/(?:mp4|webm|quicktime))"/g;
  while ((e = videoMimeRe.exec(decoded))) {
    addChild(map, e[1]!, "video.mp4", e[2]!);
  }

  const videoMimeFirstRe =
    /"(video\/(?:mp4|webm|quicktime))"[\s\S]{0,220}"([A-Za-z0-9_-]{16,})"/g;
  while ((e = videoMimeFirstRe.exec(decoded))) {
    addChild(map, e[2]!, "video.mp4", e[1]!);
  }

  const extInTextRe =
    /"([A-Za-z0-9_-]{16,})"[^"]{0,80}"([^"]{1,200}\.(?:mp4|webm|mov|m4v))"/gi;
  while ((e = extInTextRe.exec(decoded))) {
    addChild(map, e[1]!, e[2]!, "video/mp4");
  }

  return [...map.values()];
}

async function fetchFolderHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) return "";
  return res.text();
}

export async function listPublicDriveChildren(
  folderId: string,
): Promise<DriveChild[]> {
  const id = folderId.trim();
  if (!id) return [];
  const hit = childCache.get(id);
  if (hit && Date.now() - hit.at < CHILD_TTL_MS) return hit.items;

  const urls = [
    `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}#list`,
    `https://drive.google.com/drive/folders/${encodeURIComponent(id)}?usp=sharing`,
    `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`,
  ];

  let items: DriveChild[] = [];
  for (const url of urls) {
    try {
      const html = await fetchFolderHtml(url);
      if (!html) continue;
      items = parseDriveHtml(html).filter((c) => c.id !== id);
      if (items.length) break;
    } catch {
      /* try next */
    }
  }

  childCache.set(id, { at: Date.now(), items });
  return items;
}

export function isDriveFolder(child: DriveChild): boolean {
  if (child.mime === FOLDER_MIME) return true;
  if (isDriveImage(child) || isDriveVideo(child)) return false;
  return !/\.[a-z0-9]{2,5}$/i.test(child.name.trim());
}

export function isDriveImage(child: DriveChild): boolean {
  return child.mime.startsWith("image/") || isImageName(child.name);
}

export function isDriveVideo(child: DriveChild): boolean {
  return child.mime.startsWith("video/") || isVideoName(child.name);
}

export function driveFileUrl(id: string): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
}

export function driveVideoFileUrl(id: string): string {
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

export function driveVideoStreamSrc(id: string): string {
  return `/api/travel-lifestyle/stream?id=${encodeURIComponent(id)}`;
}

export function driveFolderUrl(id: string): string {
  return `https://drive.google.com/drive/folders/${id}`;
}

export function groupFolderKind(
  name: string,
): "public" | "private" | null {
  const n = name.replace(/\u00a0/g, " ").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (n === "public" || n.startsWith("public ")) return "public";
  if (n === "private" || n.startsWith("private ")) return "private";
  return null;
}
