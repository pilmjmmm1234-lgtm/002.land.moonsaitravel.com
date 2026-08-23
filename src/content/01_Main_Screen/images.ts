/**
 * 01_Main_Screen media source config.
 * Primary: Google Apps Script web app (no Drive API key).
 * Fallback: local public/01_Main_Screen images.
 */

/** Combined Google Apps Script Web App — same source as page 4 / lifestyle */
export const MAIN_SCREEN_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzJPeh0yd_260sdccIsc5btCfIhsB-tx2szQwlf5FxUYjJqQqgeTeeJogieK2SBOrFrPQ/exec";

/** Local asset folder used only when Apps Script fails. */
export const MAIN_SCREEN_LOCAL_DIR = "01_Main_Screen";

/** Hold each slide (ms) before starting the next crossfade. */
export const MAIN_SCREEN_HOLD_MS = 9000;

/** Crossfade duration (ms) — slow, opacity only. */
export const MAIN_SCREEN_CROSSFADE_MS = 1800;

/** How often to re-list Apps Script images (ms). */
export const MAIN_SCREEN_REFRESH_MS = 60_000;
