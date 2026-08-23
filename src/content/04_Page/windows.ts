/**
 * Page 4 window ↔ Google Drive folder mapping.
 * Path: Moon's AI Travel / 04_Page / Window_*
 *
 * Window_Main — large top window images from Apps Script windowMain.images
 * Window_01–03 — lower row videos from Apps Script window01/02/03.videos
 */
export const PAGE4_WINDOW_IDS = [
  "Window_Main",
  "Window_01",
  "Window_02",
  "Window_03",
] as const;

export type Page4WindowId = (typeof PAGE4_WINDOW_IDS)[number];

export const DRIVE_FOLDER_PATH = {
  root: "Moon's AI Travel",
  page: "04_Page",
} as const;

/**
 * Combined Apps Script web app (URL fixed — do not change without product ask).
 */
export const PAGE4_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzJPeh0yd_260sdccIsc5btCfIhsB-tx2szQwlf5FxUYjJqQqgeTeeJogieK2SBOrFrPQ/exec";

/**
 * Apps Script JSON block key for each bottom window's videos array.
 * Window_01 → window01.videos
 * Window_02 → window02.videos
 * Window_03 → window03.videos
 */
export const PAGE4_WINDOW_VIDEO_JSON_KEY: Partial<
  Record<Page4WindowId, string>
> = {
  Window_01: "window01",
  Window_02: "window02",
  Window_03: "window03",
};

/** Apps Script JSON key for Window_Main images only (never videos). */
export const PAGE4_WINDOW_MAIN_JSON_KEY = "windowMain" as const;

export function isPage4WindowId(value: string): value is Page4WindowId {
  return (PAGE4_WINDOW_IDS as readonly string[]).includes(value);
}
