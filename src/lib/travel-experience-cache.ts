/**
 * Scoped caches: models, places, gallery — never mix full Drive trees.
 */

type CacheEntry = {
  at: number;
  key: string;
  payload: unknown;
};

const TTL_MS = 10 * 60_000;
const caches = new Map<string, CacheEntry>();

export function destCacheKey(folder = "", cover = "cover.jpg"): string {
  return `models::${folder.trim()}::${cover.trim() || "cover.jpg"}`;
}

export function invalidateTravelExperienceCache(): void {
  caches.clear();
}

async function getJson(path: string, key: string): Promise<unknown> {
  const hit = caches.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.payload;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  const payload = await res.json();
  caches.set(key, { at: Date.now(), key, payload });
  return payload;
}

export async function fetchTravelExperienceDestinationsCached(
  opts: { folder?: string; cover?: string } = {},
): Promise<unknown> {
  const folder = opts.folder?.trim() ?? "";
  const cover = opts.cover?.trim() || "cover.jpg";
  const qs = new URLSearchParams({ scope: "models", cover });
  if (folder) qs.set("folder", folder);
  return getJson(`/api/travel-experience/destinations?${qs}`, destCacheKey(folder, cover));
}

export async function fetchTravelPlacesCached(opts: {
  modelId: string;
  cover?: string;
}): Promise<unknown> {
  const cover = opts.cover?.trim() || "cover.jpg";
  const qs = new URLSearchParams({
    scope: "places",
    model: opts.modelId,
    cover,
  });
  return getJson(
    `/api/travel-experience/destinations?${qs}`,
    `places::${opts.modelId}::${cover}`,
  );
}

export async function fetchTravelGalleryCached(placeId: string): Promise<unknown> {
  const qs = new URLSearchParams({ scope: "gallery", place: placeId });
  return getJson(
    `/api/travel-experience/destinations?${qs}`,
    `gallery-v3::${placeId}`,
  );
}

export function preloadImage(
  src: string,
  priority: "high" | "auto" = "auto",
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    try {
      img.fetchPriority = priority;
    } catch {
      /* ignore */
    }
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}
