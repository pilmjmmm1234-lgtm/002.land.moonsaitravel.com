export type DriveMediaKind = "image" | "video";

export type DriveMediaItem = {
  id: string;
  name: string;
  kind: DriveMediaKind;
  /** Same-origin URL the browser loads (proxy or static). */
  src: string;
  /** Fingerprint for change detection (modified time or size). */
  etag: string;
};

export type DriveWindowListing = {
  windowId: string;
  source: "google-drive" | "local-mirror";
  items: DriveMediaItem[];
};

/** Any openable file from a Menu folder (media, docs, shortcuts, etc.). */
export type DriveOpenItem = {
  id: string;
  name: string;
  /** URL to open (same-origin proxy, static path, or Drive web view). */
  src: string;
  etag: string;
};

export type DriveMenuListing = {
  menuId: string;
  source: "google-drive" | "local-mirror";
  items: DriveOpenItem[];
};
