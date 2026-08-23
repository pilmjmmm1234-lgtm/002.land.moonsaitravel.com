import type { DriveMediaItem } from "@/lib/drive/types";

type CacheEntry = {
  at: number;
  items: DriveMediaItem[];
};

let cache: CacheEntry | null = null;
const TTL_MS = 120_000;

export async function fetchMainScreenItemsCached(): Promise<DriveMediaItem[]> {
  if (cache && Date.now() - cache.at < TTL_MS && cache.items.length > 0) {
    return cache.items;
  }
  const res = await fetch("/api/drive/main-screen", { cache: "default" });
  if (!res.ok) return cache?.items ?? [];
  const data = (await res.json()) as { items?: DriveMediaItem[] };
  const items = (data.items ?? []).filter((i) => i.kind === "image" && i.src);
  if (items.length > 0) {
    cache = { at: Date.now(), items };
  }
  return items;
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}
