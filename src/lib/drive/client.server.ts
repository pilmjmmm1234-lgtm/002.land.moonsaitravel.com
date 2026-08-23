import { readdir, stat, readFile } from "node:fs/promises";
import path from "node:path";
import type { Page4WindowId } from "@/content/04_Page/windows";
import {
  PAGE4_APPS_SCRIPT_URL,
  PAGE4_WINDOW_MAIN_JSON_KEY,
  PAGE4_WINDOW_VIDEO_JSON_KEY,
} from "@/content/04_Page/windows";
import type { Page4MenuId } from "@/content/04_Page/menus";
import { IMAGE_QUALITY, IMAGE_WIDTH } from "@/lib/image-proxy";
import {
  MAIN_SCREEN_APPS_SCRIPT_URL,
  MAIN_SCREEN_LOCAL_DIR,
} from "@/content/01_Main_Screen/images";
import { kindFromMime, kindFromName, isSupportedMedia } from "./media";
import type {
  DriveMediaItem,
  DriveMenuListing,
  DriveOpenItem,
  DriveWindowListing,
} from "./types";

const DRIVE_API = "https://www.googleapis.com/drive/v3";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  shortcutDetails?: { targetId?: string; targetMimeType?: string };
};

type AppsScriptMedia = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string;
};

type AppsScriptMainScreenResponse = {
  success?: boolean;
  folder?: string;
  count?: number;
  images?: AppsScriptMedia[];
  mainScreen?: {
    folder?: string;
    count?: number;
    images?: AppsScriptMedia[];
  };
};

export function hasDriveApiKey(): boolean {
  return Boolean(apiKey());
}

function apiKey(): string | undefined {
  const key = (
    process.env.GOOGLE_DRIVE_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  ).trim();
  return key || undefined;
}

function windowFolderId(windowId: Page4WindowId): string | undefined {
  const map: Record<Page4WindowId, string | undefined> = {
    Window_Main:
      process.env.GDRIVE_WINDOW_MAIN_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_WINDOW_MAIN_FOLDER_ID,
    Window_01:
      process.env.GDRIVE_WINDOW_01_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_WINDOW_01_FOLDER_ID,
    Window_02:
      process.env.GDRIVE_WINDOW_02_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_WINDOW_02_FOLDER_ID,
    Window_03:
      process.env.GDRIVE_WINDOW_03_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_WINDOW_03_FOLDER_ID,
  };
  const id = map[windowId]?.trim();
  return id || undefined;
}

function menuFolderId(menuId: Page4MenuId): string | undefined {
  const map: Record<Page4MenuId, string | undefined> = {
    Menu_01:
      process.env.GDRIVE_MENU_01_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_MENU_01_FOLDER_ID,
    Menu_02:
      process.env.GDRIVE_MENU_02_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_MENU_02_FOLDER_ID,
    Menu_03:
      process.env.GDRIVE_MENU_03_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_MENU_03_FOLDER_ID,
    Menu_04:
      process.env.GDRIVE_MENU_04_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_MENU_04_FOLDER_ID,
    Menu_05:
      process.env.GDRIVE_MENU_05_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_MENU_05_FOLDER_ID,
    Menu_06:
      process.env.GDRIVE_MENU_06_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_MENU_06_FOLDER_ID,
  };
  const id = map[menuId]?.trim();
  return id || undefined;
}

function localWindowDir(windowId: Page4WindowId): string {
  return path.join(process.cwd(), "public", "04_Page", windowId);
}

function localMenuDir(menuId: Page4MenuId): string {
  return path.join(process.cwd(), "public", "04_Page", "Menu", menuId);
}

function localMainScreenDir(): string {
  return path.join(process.cwd(), "public", MAIN_SCREEN_LOCAL_DIR);
}

async function fetchDriveFiles(folderId: string, key: string): Promise<DriveFile[]> {
  if (!folderId) return [];
  const q = encodeURIComponent(
    `'${folderId}' in parents and trashed = false`,
  );
  const fields = encodeURIComponent(
    "files(id,name,mimeType,modifiedTime,size,webViewLink,shortcutDetails)",
  );
  const url = `${DRIVE_API}/files?q=${q}&fields=${fields}&pageSize=200&orderBy=name&key=${encodeURIComponent(key)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Drive list failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

async function listWindowGoogleDrive(
  folderId: string,
  key: string,
): Promise<DriveMediaItem[]> {
  const files = await fetchDriveFiles(folderId, key);
  return files
    .filter((f) => isSupportedMedia(f.name, f.mimeType))
    .map((f) => {
      const kind = kindFromMime(f.mimeType, f.name)!;
      return {
        id: f.id,
        name: f.name,
        kind,
        src: `/api/drive/file/${encodeURIComponent(f.id)}`,
        etag: `${f.modifiedTime ?? ""}:${f.size ?? ""}`,
      } satisfies DriveMediaItem;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listWindowLocal(
  windowId: Page4WindowId,
): Promise<DriveMediaItem[]> {
  const dir = localWindowDir(windowId);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const items: DriveMediaItem[] = [];
  for (const name of names) {
    const kind = kindFromName(name);
    if (!kind) continue;
    // Window_Main is image-only
    if (windowId === "Window_Main" && kind !== "image") continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = await stat(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    items.push({
      id: `local:${windowId}:${name}`,
      name,
      kind,
      src: `/04_Page/${windowId}/${encodeURIComponent(name)}`,
      etag: `${st.mtimeMs}:${st.size}`,
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Window_Main images from Apps Script windowMain.images (never videos).
 */
async function normalizeDriveImageUrl(url: string): Promise<string[]> {
  // Prefer view / thumbnail variants that work for publicly shared files
  const candidates = [url];
  try {
    const u = new URL(url);
    const id =
      u.searchParams.get("id") ||
      u.pathname.match(/\/d\/([^/]+)/)?.[1] ||
      "";
    if (id) {
      candidates.push(`https://drive.google.com/uc?export=view&id=${id}`);
      candidates.push(`https://drive.google.com/thumbnail?id=${id}&sz=w2000`);
      candidates.push(`https://lh3.googleusercontent.com/d/${id}`);
    }
    if (url.includes("export=download")) {
      candidates.push(url.replace("export=download", "export=view"));
    }
  } catch {
    /* keep original only */
  }
  return [...new Set(candidates)];
}

async function isPublicDriveImage(url: string): Promise<string | null> {
  for (const candidate of await normalizeDriveImageUrl(url)) {
    try {
      const res = await fetch(candidate, {
        redirect: "follow",
        headers: {
          Accept: "image/*,*/*",
          "User-Agent": "Mozilla/5.0 MoonAITravelImageProbe",
        },
      });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") || "";
      if (type.startsWith("image/")) return candidate;
      // Some hosts omit type; sniff first bytes
      const buf = new Uint8Array(await res.arrayBuffer());
      if (
        buf.length > 3 &&
        ((buf[0] === 0xff && buf[1] === 0xd8) || // jpeg
          (buf[0] === 0x89 && buf[1] === 0x50) || // png
          (buf[0] === 0x52 && buf[1] === 0x49) || // webp/riff
          (buf[0] === 0x47 && buf[1] === 0x49)) // gif
      ) {
        return candidate;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

async function listWindowMainImagesFromScript(): Promise<DriveMediaItem[] | null> {
  const scriptUrl = PAGE4_APPS_SCRIPT_URL?.trim();
  if (!scriptUrl) return null;

  try {
    const res = await fetch(scriptUrl, {
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const block = data[PAGE4_WINDOW_MAIN_JSON_KEY] as
      | { images?: AppsScriptMedia[] }
      | undefined;
    const images = block?.images ?? [];
    if (!images.length) return null;

    const items: DriveMediaItem[] = [];
    for (const img of images) {
      const rawUrl = img?.url?.trim();
      if (!rawUrl) continue;
      const name = img.name?.trim() || img.id || "image";
      const mime = img.mimeType ?? "";
      if (mime && kindFromMime(mime, name) === "video") continue;

      items.push({
        id: img.id || rawUrl,
        name,
        kind: "image",
        src: `/api/drive/main-screen/image?src=${encodeURIComponent(rawUrl)}&w=${IMAGE_WIDTH.hero}&q=${IMAGE_QUALITY.hero}`,
        etag: `${img.id ?? ""}:${name}`,
      });
    }
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

/**
 * Bottom windows: window0N.videos[] for matching Window_0N.
 * Uses video URLs; empty → null (local/image fallback).
 * Window_Main is not handled here.
 */
async function listBottomWindowVideos(
  windowId: Page4WindowId,
): Promise<DriveMediaItem[] | null> {
  const jsonKey = PAGE4_WINDOW_VIDEO_JSON_KEY[windowId];
  if (!jsonKey) return null;

  const scriptUrl = PAGE4_APPS_SCRIPT_URL?.trim();
  if (!scriptUrl) return null;

  try {
    const res = await fetch(scriptUrl, {
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const block = data[jsonKey] as
      | { videos?: AppsScriptMedia[]; images?: AppsScriptMedia[] }
      | undefined;
    const videos = block?.videos ?? [];
    if (!videos.length) return null;

    const items: DriveMediaItem[] = [];
    for (const clip of videos) {
      const rawUrl = clip?.url?.trim();
      if (!rawUrl) continue;
      const name = clip?.name?.trim() || clip?.id || "video";
      items.push({
        id: clip?.id || rawUrl,
        name,
        kind: "video",
        src: `/api/travel-lifestyle/stream?src=${encodeURIComponent(rawUrl)}`,
        etag: `${clip?.id ?? ""}:${name}`,
      });
    }
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

/** Image fallback from the same window0N.images block when no videos. */
async function listWindowImagesFromScript(
  windowId: Page4WindowId,
): Promise<DriveMediaItem[] | null> {
  const jsonKey = PAGE4_WINDOW_VIDEO_JSON_KEY[windowId];
  if (!jsonKey) return null;

  const scriptUrl = PAGE4_APPS_SCRIPT_URL?.trim();
  if (!scriptUrl) return null;
  try {
    const res = await fetch(scriptUrl, {
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const block = data[jsonKey] as { images?: AppsScriptMedia[] } | undefined;
    const images = block?.images ?? [];
    if (!images.length) return null;

    const items: DriveMediaItem[] = [];
    for (const img of images) {
      const rawUrl = img?.url?.trim();
      if (!rawUrl) continue;
      const name = img.name?.trim() || img.id || "image";
      items.push({
        id: img.id || rawUrl,
        name,
        kind: "image",
        src: `/api/drive/main-screen/image?src=${encodeURIComponent(rawUrl)}&w=${IMAGE_WIDTH.card}&q=${IMAGE_QUALITY.card}`,
        etag: `${img.id ?? ""}:${name}`,
      });
    }
    return items.length ? items : null;
  } catch {
    return null;
  }
}

export async function listWindowMedia(
  windowId: Page4WindowId,
): Promise<DriveWindowListing> {
  // Window_Main: images only from windowMain.images
  if (windowId === "Window_Main") {
    const mainImgs = await listWindowMainImagesFromScript();
    if (mainImgs && mainImgs.length > 0) {
      return { windowId, source: "google-drive", items: mainImgs };
    }
    // fallback local only (e.g. previous sample / Santorini stand-in)
    const local = await listWindowLocal("Window_Main");
    return { windowId, source: "local-mirror", items: local };
  }

  // Window_01–03: videos (unchanged path)
  const video = await listBottomWindowVideos(windowId);
  if (video && video.length > 0) {
    return { windowId, source: "google-drive", items: video };
  }
  const imgs = await listWindowImagesFromScript(windowId);
  if (imgs && imgs.length > 0) {
    return { windowId, source: "google-drive", items: imgs };
  }

  const key = apiKey();
  const folderId = windowFolderId(windowId);

  if (key && folderId) {
    try {
      const items = await listWindowGoogleDrive(folderId, key);
      return { windowId, source: "google-drive", items };
    } catch {
      /* optional */
    }
  }

  const items = await listWindowLocal(windowId);
  return { windowId, source: "local-mirror", items };
}

async function listMainScreenLocal(): Promise<DriveMediaItem[]> {
  const dir = localMainScreenDir();
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const items: DriveMediaItem[] = [];
  for (const name of names) {
    if (kindFromName(name) !== "image") continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = await stat(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    items.push({
      id: `local:main:${name}`,
      name,
      kind: "image",
      src: `/${MAIN_SCREEN_LOCAL_DIR}/${encodeURIComponent(name)}`,
      etag: `${st.mtimeMs}:${st.size}`,
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listMainScreenImages(): Promise<{
  folderId: string;
  source: "apps-script" | "local-mirror";
  items: DriveMediaItem[];
  driveEnabled: boolean;
}> {
  const scriptUrl = MAIN_SCREEN_APPS_SCRIPT_URL?.trim();

  if (scriptUrl) {
    try {
      const res = await fetch(scriptUrl, {
        redirect: "follow",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Apps Script HTTP ${res.status}`);
      }
      const data = (await res.json()) as AppsScriptMainScreenResponse;
      if (data.success === false) {
        throw new Error("Apps Script returned success:false");
      }

      const images =
        data.images ?? data.mainScreen?.images ?? [];
      const items: DriveMediaItem[] = [];
      for (const img of images) {
        const rawUrl = img?.url?.trim();
        if (!rawUrl) continue;
        const name = img.name?.trim() || img.id || "image";
        const mime = img.mimeType ?? "";
        if (mime && kindFromMime(mime, name) !== "image") continue;
        const src = `/api/drive/main-screen/image?src=${encodeURIComponent(rawUrl)}&w=${IMAGE_WIDTH.hero}&q=${IMAGE_QUALITY.hero}`;
        items.push({
          id: img.id || rawUrl,
          name,
          kind: "image",
          src,
          etag: `${img.id ?? ""}:${name}`,
        });
      }

      if (items.length > 0) {
        return {
          folderId: data.folder || data.mainScreen?.folder || "01_Main_Screen",
          source: "apps-script",
          items,
          driveEnabled: false,
        };
      }
    } catch {
      /* fall through to local */
    }
  }

  const items = await listMainScreenLocal();
  return {
    folderId: MAIN_SCREEN_LOCAL_DIR,
    source: "local-mirror",
    items,
    driveEnabled: false,
  };
}

function openSrcForDriveFile(f: DriveFile): string {
  if (isSupportedMedia(f.name, f.mimeType)) {
    return `/api/drive/file/${encodeURIComponent(f.id)}`;
  }
  if (f.webViewLink) return f.webViewLink;
  return `https://drive.google.com/file/d/${encodeURIComponent(f.id)}/view`;
}

async function listMenuGoogleDrive(
  folderId: string,
  key: string,
): Promise<DriveOpenItem[]> {
  const files = await fetchDriveFiles(folderId, key);
  return files
    .filter((f) => f.mimeType !== "application/vnd.google-apps.folder")
    .map((f) => ({
      id: f.id,
      name: f.name,
      src: openSrcForDriveFile(f),
      etag: `${f.modifiedTime ?? ""}:${f.size ?? ""}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listMenuLocal(menuId: Page4MenuId): Promise<DriveOpenItem[]> {
  const dir = localMenuDir(menuId);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }

  const items: DriveOpenItem[] = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = await stat(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;

    if (name.toLowerCase().endsWith(".url")) {
      try {
        const text = await readFile(full, "utf8");
        const match = text.match(/URL=(.+)/i);
        const target = match?.[1]?.trim();
        if (target) {
          items.push({
            id: `local-menu:${menuId}:${name}`,
            name,
            src: target,
            etag: `${st.mtimeMs}:${st.size}`,
          });
          continue;
        }
      } catch {
        /* fall through */
      }
    }

    items.push({
      id: `local-menu:${menuId}:${name}`,
      name,
      src: `/04_Page/Menu/${menuId}/${encodeURIComponent(name)}`,
      etag: `${st.mtimeMs}:${st.size}`,
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listMenuMedia(
  menuId: Page4MenuId,
): Promise<DriveMenuListing> {
  const key = apiKey();
  const folderId = menuFolderId(menuId);

  if (key && folderId) {
    try {
      const items = await listMenuGoogleDrive(folderId, key);
      return { menuId, source: "google-drive", items };
    } catch {
      /* optional */
    }
  }

  const items = await listMenuLocal(menuId);
  return { menuId, source: "local-mirror", items };
}

export async function streamGoogleDriveFile(
  fileId: string,
): Promise<Response> {
  const key = apiKey();
  if (!key) {
    return new Response("Drive disabled", { status: 503 });
  }
  if (!fileId || fileId === "null" || fileId === "undefined") {
    return new Response("Invalid file id", { status: 400 });
  }

  const metaUrl = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=mimeType,name&key=${encodeURIComponent(key)}`;
  const metaRes = await fetch(metaUrl);
  if (!metaRes.ok) {
    return new Response("File not found", { status: metaRes.status });
  }
  const meta = (await metaRes.json()) as { mimeType?: string; name?: string };
  if (!isSupportedMedia(meta.name ?? "", meta.mimeType)) {
    return new Response("Unsupported media", { status: 415 });
  }

  const mediaUrl = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&key=${encodeURIComponent(key)}`;
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok || !mediaRes.body) {
    return new Response("Failed to fetch media", { status: mediaRes.status });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    meta.mimeType ||
      (kindFromName(meta.name ?? "") === "video" ? "video/mp4" : "image/jpeg"),
  );
  headers.set("Cache-Control", "public, max-age=60");
  const len = mediaRes.headers.get("content-length");
  if (len) headers.set("Content-Length", len);

  return new Response(mediaRes.body, { status: 200, headers });
}
