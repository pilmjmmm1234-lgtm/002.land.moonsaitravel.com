"use client";

import { useEffect, useState } from "react";
import { PAGE4_WINDOW_IDS } from "@/content/04_Page/windows";

const DB_NAME = "mwr-admin";
const STORE = "window-images";
const META_KEY = "mwr-window-media-meta-v1";
const EVENT = "mwr-window-media";

export type AdminMediaId = (typeof PAGE4_WINDOW_IDS)[number];

export type WindowMediaMeta = {
  kind: "upload" | "drive";
  name?: string;
  driveUrl?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function drivePreviewUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const file =
    t.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
    t.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  if (file) return `https://lh3.googleusercontent.com/d/${file}=s2048`;
  return t;
}

export function loadWindowMediaMeta(): Record<string, WindowMediaMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WindowMediaMeta>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMeta(next: Record<string, WindowMediaMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export async function saveWindowUpload(
  id: AdminMediaId,
  file: File,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const meta = loadWindowMediaMeta();
  meta[id] = { kind: "upload", name: file.name };
  saveMeta(meta);
}

export function saveWindowDriveUrl(id: AdminMediaId, url: string): void {
  const meta = loadWindowMediaMeta();
  meta[id] = { kind: "drive", driveUrl: url.trim() };
  saveMeta(meta);
}

export async function clearWindowOverride(id: AdminMediaId): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
  const meta = loadWindowMediaMeta();
  delete meta[id];
  saveMeta(meta);
}

export function useWindowOverrideSrc(id: AdminMediaId): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;

    const load = async () => {
      const meta = loadWindowMediaMeta()[id];
      if (!meta) {
        if (alive) setSrc(null);
        return;
      }
      if (meta.kind === "drive" && meta.driveUrl) {
        if (alive) setSrc(drivePreviewUrl(meta.driveUrl));
        return;
      }
      if (meta.kind === "upload") {
        try {
          const db = await openDb();
          const blob = await new Promise<Blob | undefined>((resolve, reject) => {
            const tx = db.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get(id);
            req.onsuccess = () => resolve(req.result as Blob | undefined);
            req.onerror = () => reject(req.error);
          });
          db.close();
          if (!alive) return;
          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            setSrc(objectUrl);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      if (alive) setSrc(null);
    };

    void load();
    const onChange = () => void load();
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      alive = false;
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return src;
}
