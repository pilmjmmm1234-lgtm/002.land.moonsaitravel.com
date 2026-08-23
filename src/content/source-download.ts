/**
 * Homepage source ZIP download.
 * Change password and Drive file here only.
 */

/** Unlock password for the download button */
export const SOURCE_ZIP_PASSWORD = "0000";

/**
 * Google Drive file id of the latest homepage ZIP.
 * Example: from https://drive.google.com/file/d/FILE_ID/view
 */
export const SOURCE_ZIP_DRIVE_FILE_ID = "";

/** Optional full Drive URL. Used if FILE_ID is empty. */
export const SOURCE_ZIP_DRIVE_URL = "";

export function sourceZipDownloadHrefFrom(
  fileId: string,
  url: string,
): string {
  const id = fileId.trim();
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
  }
  return url.trim();
}

export function sourceZipDownloadHref(): string {
  return sourceZipDownloadHrefFrom(
    SOURCE_ZIP_DRIVE_FILE_ID,
    SOURCE_ZIP_DRIVE_URL,
  );
}
