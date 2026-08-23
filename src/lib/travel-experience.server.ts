import { TRAVEL_EXPERIENCE_APPS_SCRIPT_URL } from "@/content/travel-experience";
import { displayDestName, destMatches, extractDriveFolderId } from "@/lib/dest-names";
import {
  driveFileUrl,
  driveFolderUrl,
  driveVideoStreamSrc,
  groupFolderKind,
  isDriveFolder,
  isDriveImage,
  isDriveVideo,
  listPublicDriveChildren,
  type DriveChild,
} from "@/lib/drive-folder-list";
import { driveImageProxy, extractDriveFileId } from "@/lib/image-proxy";

export type TeMedia = {
  id: string;
  name: string;
  mimeType?: string;
  url: string;
};

export type TeStory = {
  id: string;
  name: string;
  images: TeMedia[];
  thumbnail: TeMedia | null;
  coverSrc: string | null;
};

export type TeDestination = {
  id: string;
  name: string;
  coverSrc: string | null;
  coverFound: boolean;
  coverName: string | null;
  cardSrc: string | null;
  folderUrl: string;
  stories: TeStory[];
};

export type TeModelCard = {
  id: string;
  name: string;
  coverSrc: string | null;
  cardSrc: string | null;
  folderUrl: string;
};

export type TePlaceCard = {
  id: string;
  name: string;
  coverSrc: string | null;
};

type RawMedia = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string;
};

type RawStory = {
  id?: string;
  name?: string;
  images?: RawMedia[];
  thumbnail?: RawMedia | null;
  cover?: RawMedia | null;
};

type RawDestination = {
  id?: string;
  name?: string;
  stories?: RawStory[];
  cover?: RawMedia | null;
  images?: RawMedia[];
};

function proxyImage(
  url: string,
  preset: "card" | "story" | "hero" = "card",
): string {
  return driveImageProxy(url, preset);
}

function mapMedia(raw?: RawMedia | null): TeMedia | null {
  const url = raw?.url?.trim();
  if (!url) return null;
  return {
    id: raw?.id || url,
    name: raw?.name?.trim() || raw?.id || "media",
    mimeType: raw?.mimeType,
    url,
  };
}

function isCoverFile(name: string, coverFileName = "cover.jpg"): boolean {
  const n = name.trim().toLowerCase();
  const wanted = coverFileName.trim().toLowerCase() || "cover.jpg";
  const wantedBase = wanted.replace(/\.[^.]+$/, "");
  return (
    n === wanted ||
    n === "cover.jpg" ||
    n === "cover.jpeg" ||
    n === "cover.png" ||
    n === "cover.webp" ||
    n === "cover.gif" ||
    n === `${wantedBase}.jpg` ||
    n === `${wantedBase}.jpeg` ||
    n === `${wantedBase}.png` ||
    n === `${wantedBase}.webp`
  );
}

function isCoverFolder(name: string): boolean {
  return name.trim().toLowerCase() === "cover";
}

function pickCoverMedia(
  images: TeMedia[],
  coverFileName = "cover.jpg",
): TeMedia | null {
  return images.find((m) => isCoverFile(m.name, coverFileName)) ?? null;
}

function notCoverMedia(m: TeMedia): boolean {
  return Boolean(m.url) && !isCoverFile(m.name);
}

function storyCover(story: TeStory): string | null {
  const pool = story.images.filter(notCoverMedia);
  if (pool.length > 0) {
    return proxyImage(pool[0]!.url, "card");
  }
  if (story.thumbnail?.url && !isCoverFile(story.thumbnail.name)) {
    return proxyImage(story.thumbnail.url, "card");
  }
  return null;
}

function destCardFrom(stories: TeStory[]): string | null {
  for (const story of stories) {
    if (story.coverSrc) return story.coverSrc;
    const first = story.images.find(notCoverMedia);
    if (first) return proxyImage(first.url, "card");
  }
  return null;
}

function destCoverOnly(
  raw: RawDestination,
  destImages: TeMedia[],
  coverFileName = "cover.jpg",
): { src: string | null; found: boolean; name: string | null } {
  const explicit = mapMedia(raw.cover ?? null);
  if (explicit?.url) {
    return { src: proxyImage(explicit.url, "hero"), found: true, name: explicit.name };
  }
  const destNamed = pickCoverMedia(destImages, coverFileName);
  if (destNamed?.url) {
    return { src: proxyImage(destNamed.url, "hero"), found: true, name: destNamed.name };
  }
  const firstRoot = destImages.find((m) => m.url && isImageName(m.name));
  if (firstRoot?.url) {
    return { src: proxyImage(firstRoot.url, "hero"), found: true, name: firstRoot.name };
  }
  return { src: null, found: false, name: null };
}

function isImageName(name: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif|bmp|heic)$/i.test(name.trim());
}

function mapStory(raw: RawStory): TeStory | null {
  const id = raw.id?.trim();
  if (!id) return null;
  const images = (raw.images ?? [])
    .map((m) => mapMedia(m))
    .filter((m): m is TeMedia => m !== null)
    .filter((m) => !isCoverFile(m.name));
  const thumbnail = mapMedia(raw.thumbnail ?? null);
  const mapped: TeStory = {
    id,
    name: raw.name?.trim() || id,
    images,
    thumbnail:
      thumbnail && !isCoverFile(thumbnail.name) ? thumbnail : null,
    coverSrc: null,
  };
  mapped.coverSrc = storyCover(mapped);
  return mapped;
}

function folderUrlFor(id: string): string {
  return driveFolderUrl(id);
}

function mapDestination(
  raw: RawDestination,
  coverFileName = "cover.jpg",
): TeDestination | null {
  const id = raw.id?.trim();
  if (!id) return null;
  const destImages = (raw.images ?? [])
    .map((m) => mapMedia(m))
    .filter((m): m is TeMedia => m !== null)
    .filter((m) => isImageName(m.name) || Boolean(m.mimeType?.startsWith("image/")));
  const stories = (raw.stories ?? [])
    .map((s) => mapStory(s))
    .filter((s): s is TeStory => s !== null)
    .filter(
      (s) =>
        !isCoverFolder(s.name) &&
        !isCoverFile(s.name, coverFileName) &&
        !isImageName(s.name),
    );
  const cover = destCoverOnly(raw, destImages, coverFileName);
  return {
    id,
    name: displayDestName(raw.name?.trim() || id),
    coverSrc: cover.src,
    coverFound: cover.found,
    coverName: cover.name,
    cardSrc: destCardFrom(stories),
    folderUrl: driveFolderUrl(id),
    stories,
  };
}

/**
 * Full tree from Apps Script — kept for compatibility, not used on first paint.
 */
export async function listTravelExperienceDestinations(
  rootFolderUrl = "",
  coverFileName = "cover.jpg",
): Promise<TeDestination[]> {
  const scriptUrl = TRAVEL_EXPERIENCE_APPS_SCRIPT_URL?.trim();
  if (!scriptUrl) return [];
  try {
    const folderId = extractDriveFolderId(rootFolderUrl);
    const endpoint = new URL(scriptUrl);
    if (folderId) {
      endpoint.searchParams.set("folderId", folderId);
      endpoint.searchParams.set("folder", folderId);
    }
    if (coverFileName.trim()) {
      endpoint.searchParams.set("cover", coverFileName.trim());
    }
    const res = await fetch(endpoint.toString(), {
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      success?: boolean;
      travelExperience?: { destinations?: RawDestination[] };
    };
    const rawList = data.travelExperience?.destinations ?? [];
    return rawList
      .map((d) => mapDestination(d, coverFileName))
      .filter((d): d is TeDestination => d !== null);
  } catch {
    return [];
  }
}

export async function getTravelExperienceDestination(
  destinationId: string,
  rootFolderUrl = "",
  coverFileName = "cover.jpg",
): Promise<TeDestination | null> {
  const id = destinationId?.trim();
  if (!id) return null;
  const all = await listTravelExperienceDestinations(
    rootFolderUrl,
    coverFileName,
  );
  return all.find((d) => destMatches(d, id)) ?? null;
}

function pickImmediateCover(
  children: DriveChild[],
  coverFileName: string,
): string | null {
  const images = children.filter(isDriveImage);
  const named = images.find((c) => isCoverFile(c.name, coverFileName));
  const first = named ?? images[0];
  return first ? proxyImage(driveFileUrl(first.id), "card") : null;
}

async function coverForFolder(
  folderId: string,
  coverFileName: string,
): Promise<string | null> {
  const children = await listPublicDriveChildren(folderId);
  return pickImmediateCover(children, coverFileName);
}

function isGroupFolderName(name: string): boolean {
  return groupFolderKind(name) !== null;
}

function findGroupFolder(
  children: DriveChild[],
  group: "public" | "private",
): DriveChild | undefined {
  return children.find(
    (c) => isDriveFolder(c) && groupFolderKind(c.name) === group,
  );
}

async function listPlaceCards(
  folderId: string,
  coverFileName: string,
): Promise<TePlaceCard[]> {
  const children = await listPublicDriveChildren(folderId);
  const folders = children.filter(
    (c) =>
      isDriveFolder(c) &&
      !isCoverFolder(c.name) &&
      !isCoverFile(c.name, coverFileName) &&
      !isGroupFolderName(c.name),
  );
  return Promise.all(
    folders.map(async (folder) => ({
      id: folder.id,
      name: displayDestName(folder.name),
      coverSrc: await coverForFolder(folder.id, coverFileName),
    })),
  );
}

/** Page 1: model folders + cover/first image only. No Public/Private scan. */
export async function listTravelModels(
  rootFolderUrl = "",
  coverFileName = "cover.jpg",
): Promise<TeModelCard[]> {
  const rootId = extractDriveFolderId(rootFolderUrl);
  if (!rootId) return [];
  const children = await listPublicDriveChildren(rootId);
  const folders = children.filter(
    (c) =>
      isDriveFolder(c) &&
      !isCoverFolder(c.name) &&
      !isCoverFile(c.name, coverFileName) &&
      !isGroupFolderName(c.name),
  );
  return Promise.all(
    folders.map(async (folder) => {
      const coverSrc = await coverForFolder(folder.id, coverFileName);
      return {
        id: folder.id,
        name: displayDestName(folder.name),
        coverSrc,
        cardSrc: coverSrc,
        folderUrl: folderUrlFor(folder.id),
      };
    }),
  );
}

/** Page 2: Public/Private destination folders inside one model. */
export async function listTravelPlaces(
  modelId: string,
  coverFileName = "cover.jpg",
): Promise<{
  modelId: string;
  publicPlaces: TePlaceCard[];
  privatePlaces: TePlaceCard[];
  places: TePlaceCard[];
}> {
  const id = modelId.trim();
  if (!id) {
    return { modelId: "", publicPlaces: [], privatePlaces: [], places: [] };
  }
  const children = await listPublicDriveChildren(id);
  const publicFolder = findGroupFolder(children, "public");
  const privateFolder = findGroupFolder(children, "private");
  const [publicPlaces, privatePlaces] = await Promise.all([
    publicFolder ? listPlaceCards(publicFolder.id, coverFileName) : Promise.resolve([]),
    privateFolder ? listPlaceCards(privateFolder.id, coverFileName) : Promise.resolve([]),
  ]);
  return {
    modelId: id,
    publicPlaces,
    privatePlaces,
    places: [...publicPlaces, ...privatePlaces],
  };
}

/** Page 3: images and videos in one destination folder only. */
export async function listTravelGallery(placeId: string): Promise<{
  placeId: string;
  images: {
    id: string;
    name: string;
    kind: "image" | "video";
    thumbUrl: string;
    url: string;
  }[];
}> {
  const id = placeId.trim();
  if (!id) return { placeId: "", images: [] };
  const children = await listPublicDriveChildren(id);
  const apiKids = await listFolderViaDriveApi(id);
  const merged = new Map<string, DriveChild>();
  for (const c of [...children, ...apiKids]) merged.set(c.id, c);

  const images = [...merged.values()]
    .filter((c) => (isDriveImage(c) || isDriveVideo(c)) && !isCoverFile(c.name))
    .map((c) => toGalleryItem(c));

  if (!images.some((item) => item.kind === "video")) {
    const extra = await videosFromAppsScript(id);
    for (const clip of extra) {
      if (!images.some((item) => item.id === clip.id)) images.push(clip);
    }
  }

  return { placeId: id, images };
}

function toGalleryItem(c: DriveChild): {
  id: string;
  name: string;
  kind: "image" | "video";
  thumbUrl: string;
  url: string;
} {
  if (isDriveVideo(c)) {
    return {
      id: c.id,
      name: c.name,
      kind: "video",
      thumbUrl: proxyImage(driveFileUrl(c.id), "card"),
      url: driveVideoStreamSrc(c.id),
    };
  }
  return {
    id: c.id,
    name: c.name,
    kind: "image",
    thumbUrl: proxyImage(driveFileUrl(c.id), "card"),
    url: proxyImage(driveFileUrl(c.id), "story"),
  };
}

async function listFolderViaDriveApi(folderId: string): Promise<DriveChild[]> {
  const key = (
    process.env.GOOGLE_DRIVE_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  ).trim();
  if (!key) return [];
  try {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent("files(id,name,mimeType)");
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=200&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      files?: { id?: string; name?: string; mimeType?: string }[];
    };
    return (data.files ?? [])
      .filter((f) => f.id && f.name)
      .map((f) => ({
        id: f.id!,
        name: f.name!,
        mime: f.mimeType || "",
      }));
  } catch {
    return [];
  }
}

function isVideoMedia(m: { name: string; mimeType?: string; url?: string }): boolean {
  if (m.mimeType?.startsWith("video/")) return true;
  if (/\.(mp4|webm|mov|m4v)$/i.test(m.name)) return true;
  if ((m.url || "").toLowerCase().includes("video")) return true;
  return false;
}

async function videosFromAppsScript(placeId: string): Promise<
  {
    id: string;
    name: string;
    kind: "video";
    thumbUrl: string;
    url: string;
  }[]
> {
  const scriptUrl = TRAVEL_EXPERIENCE_APPS_SCRIPT_URL?.trim();
  if (!scriptUrl) return [];
  try {
    const res = await fetch(scriptUrl, {
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      travelExperience?: {
        destinations?: {
          id?: string;
          images?: RawMedia[];
          videos?: RawMedia[];
          stories?: {
            id?: string;
            images?: RawMedia[];
            videos?: RawMedia[];
          }[];
        }[];
      };
    };
    const dests = data.travelExperience?.destinations ?? [];
    const pool: RawMedia[] = [];
    for (const dest of dests) {
      if (dest.id === placeId) {
        pool.push(...(dest.images ?? []), ...(dest.videos ?? []));
      }
      for (const story of dest.stories ?? []) {
        if (story.id === placeId) {
          pool.push(...(story.images ?? []), ...(story.videos ?? []));
        }
      }
    }
    const out: {
      id: string;
      name: string;
      kind: "video";
      thumbUrl: string;
      url: string;
    }[] = [];
    for (const raw of pool) {
      const mapped = mapMedia(raw);
      if (!mapped || !isVideoMedia(mapped)) continue;
      const fileId =
        extractDriveFileId(mapped.url) ||
        (mapped.id.startsWith("http") ? "" : mapped.id);
      if (!fileId) continue;
      out.push({
        id: fileId,
        name: mapped.name,
        kind: "video",
        thumbUrl: proxyImage(driveFileUrl(fileId), "card"),
        url: driveVideoStreamSrc(fileId),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function inspectTravelContent(
  rootFolderUrl = "",
  coverFileName = "cover.jpg",
): Promise<{
  rootFolderId: string;
  modelCount: number;
  models: { id: string; name: string; coverFound: boolean }[];
  publicDetected: boolean;
  privateDetected: boolean;
  destinationCount: number;
  imageCount: number;
  sampleModel: string;
  samplePlace: string;
}> {
  const rootFolderId = extractDriveFolderId(rootFolderUrl);
  const empty = {
    rootFolderId,
    modelCount: 0,
    models: [] as { id: string; name: string; coverFound: boolean }[],
    publicDetected: false,
    privateDetected: false,
    destinationCount: 0,
    imageCount: 0,
    sampleModel: "",
    samplePlace: "",
  };
  if (!rootFolderId) return empty;

  const models = await listTravelModels(rootFolderUrl, coverFileName);
  empty.modelCount = models.length;
  empty.models = models.map((m) => ({
    id: m.id,
    name: m.name,
    coverFound: Boolean(m.coverSrc),
  }));
  const first = models[0];
  if (!first) return empty;
  empty.sampleModel = first.name;

  const places = await listTravelPlaces(first.id, coverFileName);
  const modelChildren = await listPublicDriveChildren(first.id);
  empty.publicDetected = Boolean(findGroupFolder(modelChildren, "public"));
  empty.privateDetected = Boolean(findGroupFolder(modelChildren, "private"));
  empty.destinationCount = places.places.length;

  const sample = places.places[0];
  if (!sample) return empty;
  empty.samplePlace = sample.name;
  const gallery = await listTravelGallery(sample.id);
  empty.imageCount = gallery.images.length;
  return empty;
}
