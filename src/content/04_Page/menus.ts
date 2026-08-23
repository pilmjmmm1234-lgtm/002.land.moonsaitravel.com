import { MWR_KR_VIDEO_URL } from "@/content/join/links";

/**
 * Page 4 bottom menus — labels + links.
 * Menu_01 → official HQ compensation PDF
 * Menu_02 → MWR Life intro video (Drive)
 * Menu_03 → Korean guidebook Drive PDF
 * Menu_04 → reference material Drive file
 * Menu_06 → country materials Drive folder
 * Menu_05 → in-app /join (JOIN MWR LIFE)
 */
export const PAGE4_MENU_IDS = [
  "Menu_02",
  "Menu_01",
  "Menu_03",
  "Menu_04",
  "Menu_06",
  "Menu_05",
] as const;

export type Page4MenuId = (typeof PAGE4_MENU_IDS)[number];

/** Display names only */
export const PAGE4_MENU_LABELS: Record<Page4MenuId, string> = {
  Menu_01: "MWR 보상플랜",
  Menu_02: "MWR Life 소개",
  Menu_03: "MWR Life 가이드북",
  Menu_04: "MWR Life 참고자료",
  Menu_06: "국가별 자료실",
  Menu_05: "Join MWR life",
};

/** Optional tiny helper under the label */
export const PAGE4_MENU_HINTS: Partial<Record<Page4MenuId, string>> = {
  Menu_01: "본사 공식 자료 · English",
  Menu_02: "소개 영상",
  Menu_03: "한국어 가이드북",
  Menu_04: "자료실",
  Menu_06: "국가별 MWR Life 자료",
};

/** External URLs (new tab) — takes priority over Drive listing */
export const PAGE4_MENU_EXTERNAL_URLS: Partial<Record<Page4MenuId, string>> = {
  Menu_01:
    "https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/mwrlifecompplan-EN.pdf",
  Menu_02: MWR_KR_VIDEO_URL,
  Menu_03:
    "https://drive.google.com/file/d/1MuA8r-_bMJtEA409PVtmCwiMYfhiXhN9/view?usp=drive_link",
  Menu_04:
    "https://drive.google.com/drive/folders/1lE5x2FUt6xLPZCaokbWxGCehjsv_wLcu?usp=sharing",
  Menu_06:
    "https://drive.google.com/drive/folders/1n3bFQINQJXgBuV-ncUFhNhW2OOg6tFMC?usp=drive_link",
};

/** In-app routes */
export const PAGE4_MENU_ROUTES: Partial<Record<Page4MenuId, "/info/faq">> = {
  Menu_05: "/info/faq",
};

export function isPage4MenuId(value: string): value is Page4MenuId {
  return (PAGE4_MENU_IDS as readonly string[]).includes(value);
}
