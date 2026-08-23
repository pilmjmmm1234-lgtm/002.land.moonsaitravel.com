"use client";

import { useEffect, useState } from "react";
import {
  PAGE4_MENU_EXTERNAL_URLS,
  PAGE4_MENU_HINTS,
  PAGE4_MENU_IDS,
  PAGE4_MENU_LABELS,
  type Page4MenuId,
} from "@/content/04_Page/menus";
import { MENU_CONFIG_STORAGE_KEY } from "@/content/admin";
import {
  IS_MEMBER_TEMPLATE,
  MEMBER_BRAND,
  MEMBER_EMAIL_PLACEHOLDER,
  MEMBER_PRIVATE_PASSWORD,
  MEMBER_SITE_TITLE,
  SAMPLE_BRAND,
  SAMPLE_CTA,
  SAMPLE_EMAIL_BUTTON,
  SAMPLE_INQUIRY_BODY,
  SAMPLE_INQUIRY_SUBJECT,
  SAMPLE_MAIN_TITLE,
  SAMPLE_PRIVATE_MESSAGE,
  SAMPLE_SITE_TITLE,
  SAMPLE_SUBTITLE,
} from "@/content/site-profile";
import {
  MWR_KR_GUIDE_URL,
  MWR_KR_MEMBERSHIP_URL,
  MWR_KR_VIDEO_URL,
  MWR_SIGNUP_URL,
} from "@/content/join/links";
import { SOURCE_ZIP_DRIVE_FILE_ID, SOURCE_ZIP_DRIVE_URL, SOURCE_ZIP_PASSWORD } from "@/content/source-download";
import { extractDriveFolderId, displayFolderName } from "@/lib/dest-names";

export type Page4MenuConfig = {
  label: string;
  hint: string;
  url: string;
};

export type JoinLinkConfig = {
  signup: string;
  guide: string;
  video: string;
  membership: string;
};

export type SourceDownloadConfig = {
  password: string;
  fileId: string;
  url: string;
};

export type FrameTimingConfig = {
  zoomSec: number;
  holdSec: number;
  exitSec: number;
};

export type AlbumConfig = {
  turnSec: number;
  autoPlay: boolean;
  autoSec: number;
  bg: string;
  gapPx: number;
};

export type HeroBgConfig = {
  urls: string[];
  autoPlay: boolean;
  intervalSec: number;
  fadeSec: number;
  cardDelaySec: number;
  overlay: number;
};

export type DestHeroRow = {
  key: string;
  heroUrl: string;
  driveFolder: string;
};

export type DestModelFolderRow = {
  key: string;
  folderUrl: string;
};

export type DestGalleryConfig = {
  overlay: number;
  delaySec: number;
  frameStyle: "gold" | "thin" | "soft";
  mobileMode: "scroll";
  heroes: DestHeroRow[];
  rootFolderUrl: string;
  publicFolderUrl: string;
  privateFolderUrl: string;
  modelFolders: DestModelFolderRow[];
  coverFileName: string;
  themeRandomThumb: boolean;
  placeholderUrl: string;
  cardLoadSec: number;
};

export function publicModelsFolderUrl(g: DestGalleryConfig): string {
  return g.publicFolderUrl.trim() || g.rootFolderUrl.trim();
}

export function displayModelLabel(
  id: string,
  name: string,
  labels: Record<string, string> = {},
): string {
  const custom =
    labels[id]?.trim() ||
    labels[name]?.trim() ||
    labels[name.toLowerCase()]?.trim();
  return custom || displayFolderName(name);
}

export function privateModelsFolderUrl(g: DestGalleryConfig): string {
  return g.privateFolderUrl.trim();
}

export function overrideModelFolderId(
  g: DestGalleryConfig,
  modelId: string,
  modelName: string,
): string {
  const needle = `${modelId} ${modelName}`.toLowerCase();
  const row = (g.modelFolders ?? []).find((r) => {
    const key = r.key.trim().toLowerCase();
    if (!key) return false;
    return needle.includes(key) || key === modelId.toLowerCase() || key === modelName.toLowerCase();
  });
  return row ? extractDriveFolderId(row.folderUrl) : "";
}

export const DEFAULT_HERO_BG_URLS = [
  "/images/hero-travel.jpg",
  "/01_Main_Screen/santorini.jpg",
  "/01_Main_Screen/maldives.jpg",
  "/01_Main_Screen/kyoto-garden.jpg",
  "/01_Main_Screen/alpine-lake.jpg",
  "/01_Main_Screen/norwegian-fjord.jpg",
  "/01_Main_Screen/sahara.jpg",
  "/destinations/paris.jpg",
  "/destinations/switzerland.jpg",
  "/destinations/bali.jpg",
] as const;

export const ALBUM_BG_PRESETS = [
  { id: "ink", value: "#07080a", label: "Ink" },
  { id: "charcoal", value: "#121212", label: "Charcoal" },
  { id: "warm", value: "#16120e", label: "Warm" },
  { id: "navy", value: "#0c1016", label: "Navy" },
] as const;

export type MenuConfig = {
  coverTitle: string;
  coverSub: string;
  coverTitleSize: number;
  coverSubSize: number;
  page2Title: string;
  page2Sub: string;
  page2TitleSize: number;
  page2SubSize: number;
  page4Title: string;
  page4TitleSize: number;
  page4GuideTitle: string;
  page4GuideBody: string;
  page4GuidePosts: string[];
  page4GuideSize: number;
  page4Captions: {
    Window_01: string;
    Window_02: string;
    Window_03: string;
  };
  page4Ctas: {
    Window_01: string;
    Window_02: string;
    Window_03: string;
  };
  page4Details: {
    Window_01: string;
    Window_02: string;
    Window_03: string;
  };
  page4: Record<Page4MenuId, Page4MenuConfig>;
  page4MenuLabelSize: number;
  page4MenuHintSize: number;
  page5Title: string;
  page5Sub: string;
  page5TitleSize: number;
  page5SubSize: number;
  join: JoinLinkConfig;
  sourceDownload: SourceDownloadConfig;
  frameTiming: FrameTimingConfig;
  album: AlbumConfig;
  heroBg: HeroBgConfig;
  destGallery: DestGalleryConfig;
  contactEmail: string;
  brandLogoText: string;
  siteTitle: string;
  modelLabels: Record<string, string>;
  modelNameSize: number;
  ctaText: string;
  emailButtonText: string;
  privatePassword: string;
  privateAccessMessage: string;
  introHomepageUrl: string;
  inquirySubject: string;
  inquiryBody: string;
  inquiryAppsScriptUrl: string;
  themeAccent: string;
  footerText: string;
};

const EVENT = "mwr-menu-config";

export function clampMenuType(n: number, min = 8, max = 36): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function clampSize(n: number): number {
  if (!Number.isFinite(n)) return 16;
  return Math.min(96, Math.max(12, Math.round(n)));
}

export function clampFrameZoom(n: number): number {
  if (!Number.isFinite(n)) return 7.6;
  return Math.min(20, Math.max(3, Math.round(n * 10) / 10));
}

export function clampFrameHold(n: number): number {
  if (!Number.isFinite(n)) return 2.2;
  return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
}

export function clampFrameExit(n: number): number {
  if (!Number.isFinite(n)) return 1.7;
  return Math.min(8, Math.max(1, Math.round(n * 10) / 10));
}

export function clampAlbumTurn(n: number): number {
  if (!Number.isFinite(n)) return 1.6;
  return Math.min(4, Math.max(0.8, Math.round(n * 10) / 10));
}

export function clampAlbumAuto(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.min(15, Math.max(2, Math.round(n * 10) / 10));
}

export function clampAlbumGap(n: number): number {
  if (!Number.isFinite(n)) return 12;
  return Math.min(40, Math.max(0, Math.round(n)));
}

export function clampHeroInterval(n: number): number {
  if (!Number.isFinite(n)) return 10;
  return Math.min(30, Math.max(5, Math.round(n * 10) / 10));
}

export function clampHeroFade(n: number): number {
  if (!Number.isFinite(n)) return 1.4;
  return Math.min(2.5, Math.max(0.6, Math.round(n * 10) / 10));
}

export function clampHeroCardDelay(n: number): number {
  if (!Number.isFinite(n)) return 2;
  return Math.min(8, Math.max(0, Math.round(n * 10) / 10));
}

export function clampHeroOverlay(n: number): number {
  if (!Number.isFinite(n)) return 38;
  return Math.min(70, Math.max(10, Math.round(n)));
}

export function clampDestDelay(n: number): number {
  if (!Number.isFinite(n)) return 2;
  return Math.min(8, Math.max(0, Math.round(n * 10) / 10));
}

export function clampCardLoad(n: number): number {
  if (!Number.isFinite(n)) return 2;
  return Math.min(8, Math.max(0, Math.round(n * 10) / 10));
}

export function normalizeDestHeroes(raw: unknown): DestHeroRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Partial<DestHeroRow>;
      return {
        key: typeof r.key === "string" ? r.key : "",
        heroUrl: typeof r.heroUrl === "string" ? r.heroUrl : "",
        driveFolder: typeof r.driveFolder === "string" ? r.driveFolder : "",
      };
    })
    .filter((row): row is DestHeroRow => Boolean(row));
}

const LOCAL_DEST_HERO: Record<string, string> = {
  bali: "/destinations/bali.jpg",
  korea: "/images/hero-travel.jpg",
  koera: "/images/hero-travel.jpg",
  egypt: "/images/hero-travel.jpg",
  eglpt: "/images/hero-travel.jpg",
  kyoto: "/destinations/kyoto.jpg",
  tokyo: "/destinations/kyoto.jpg",
  japan: "/destinations/kyoto.jpg",
  paris: "/destinations/paris.jpg",
  maldives: "/destinations/maldives.jpg",
  switzerland: "/destinations/switzerland.jpg",
  swiss: "/destinations/switzerland.jpg",
  "new york": "/destinations/new-york.jpg",
  newyork: "/destinations/new-york.jpg",
};

export function resolveDestHero(
  destId: string,
  destName: string,
  coverSrc: string | null | undefined,
  heroes: DestHeroRow[],
): string {
  const id = destId.trim().toLowerCase();
  const name = destName.trim().toLowerCase();
  const blob = `${id} ${name}`;
  const row = heroes.find((h) => {
    const k = h.key.trim().toLowerCase();
    return Boolean(k) && (id === k || name === k || blob.includes(k));
  });
  if (row?.heroUrl.trim()) return row.heroUrl.trim();
  if (coverSrc?.trim()) return coverSrc.trim();
  for (const [key, url] of Object.entries(LOCAL_DEST_HERO)) {
    if (blob.includes(key)) return url;
  }
  return "/images/hero-travel.jpg";
}

export function normalizeHeroUrls(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : null;
  if (!arr) return [...DEFAULT_HERO_BG_URLS];
  return Array.from({ length: 10 }, (_, i) =>
    typeof arr[i] === "string" ? String(arr[i]).trim() : "",
  );
}

export const DEFAULT_PAGE4_GUIDE_POSTS = [
  "MWR은 여행 멤버십 서비스를 제공하는 회사입니다.",
  "이 페이지는 MWR의 상품 구성, 멤버십 조건, 혜택, 비용, 환불 및 해지 조건 등을 객관적으로 확인할 수 있도록 만든 안내 페이지입니다.",
  "가입 전 반드시 MWR 공식 자료와 약관을 직접 확인하시기 바랍니다.",
  "본 페이지는 가입을 강요하거나 수익을 보장하지 않으며, 최종 판단은 본인이 직접 하시기 바랍니다.",
] as const;

export function defaultMenuConfig(): MenuConfig {
  const page4 = {} as Record<Page4MenuId, Page4MenuConfig>;
  for (const id of PAGE4_MENU_IDS) {
    page4[id] = {
      label: PAGE4_MENU_LABELS[id],
      hint: PAGE4_MENU_HINTS[id] ?? "",
      url: PAGE4_MENU_EXTERNAL_URLS[id] ?? "",
    };
  }
  return {
    coverTitle: IS_MEMBER_TEMPLATE ? MEMBER_BRAND : SAMPLE_BRAND,
    coverSub: SAMPLE_SUBTITLE,
    coverTitleSize: 42,
    coverSubSize: 36,
    page2Title: SAMPLE_MAIN_TITLE,
    page2Sub: SAMPLE_SUBTITLE,
    page2TitleSize: 24,
    page2SubSize: 16,
    page4Title: "MWR Travel Membership Guide",
    page4TitleSize: 43,
    page4GuideTitle: "",
    page4GuideBody: DEFAULT_PAGE4_GUIDE_POSTS.join("\n\n"),
    page4GuidePosts: [...DEFAULT_PAGE4_GUIDE_POSTS],
    page4GuideSize: 16,
    page4Captions: {
      Window_01: "여행비 절약",
      Window_02: "회원 혜택",
      Window_03: "이용 안내",
    },
    page4Ctas: {
      Window_01: "회원제 여행 알아보기",
      Window_02: "회원 안내 보기",
      Window_03: "공식 자료 보기",
    },
    page4Details: {
      Window_01:
        "회원 전용 여행 서비스를 활용하여 호텔, 리조트 등 다양한 여행 상품을 비교하고 여행 비용을 절약할 수 있는 기회를 제공합니다.\n\n여행 상품과 가격은 여행 시기, 지역 및 조건에 따라 달라질 수 있으므로 실제 예약 시 제공되는 조건과 가격을 직접 확인하도록 안내합니다.",
      Window_02:
        "MWR Life의 여행 멤버십을 이용하면서 자신의 여행 경험과 회원 서비스를 다른 사람에게 소개할 수 있습니다.\n\n소개를 통해 새로운 고객이 회원으로 가입하는 경우 MWR Life의 보상 기준과 조건에 따라 보상을 받을 수 있는 기회가 제공됩니다.\n\n보상은 자동으로 발생하거나 보장되는 수익이 아니며, 실제 보상 조건과 기준은 MWR Life의 공식 안내를 확인하도록 합니다.",
      Window_03:
        "여행을 넘어, 또 하나의 가능성을 확인해 보세요.\n\nMWR Life는 여행 멤버십과 함께 회원이 선택적으로 참여할 수 있는 비즈니스 프로그램과 보상 정책을 운영하고 있습니다.\n\n관심 있는 분은 본사의 공식 보상플랜과 관련 자료를 통해 자세한 내용을 확인해 주세요.",
    },
    page4,
    page4MenuLabelSize: 12,
    page4MenuHintSize: 8,
    page5Title: "여행을 시작하세요",
    page5Sub:
      "MWR Life 회원 가입 전 필요한 내용을 확인하고 준비가 되면\n공식 가입 페이지에서 회원 가입을 진행하세요.",
    page5TitleSize: 30,
    page5SubSize: 16,
    join: {
      signup: MWR_SIGNUP_URL,
      guide: MWR_KR_GUIDE_URL,
      video: MWR_KR_VIDEO_URL,
      membership: MWR_KR_MEMBERSHIP_URL,
    },
    sourceDownload: {
      password: SOURCE_ZIP_PASSWORD,
      fileId: SOURCE_ZIP_DRIVE_FILE_ID,
      url: SOURCE_ZIP_DRIVE_URL,
    },
    frameTiming: {
      zoomSec: 7.6,
      holdSec: 2.2,
      exitSec: 1.7,
    },
    album: {
      turnSec: 1.6,
      autoPlay: true,
      autoSec: 5,
      bg: "#07080a",
      gapPx: 12,
    },
    heroBg: {
      urls: [...DEFAULT_HERO_BG_URLS],
      autoPlay: true,
      intervalSec: 10,
      fadeSec: 1.4,
      cardDelaySec: 2,
      overlay: 38,
    },
    destGallery: {
      overlay: 40,
      delaySec: 0.2,
      frameStyle: "gold",
      mobileMode: "scroll",
      heroes: [],
      rootFolderUrl: "",
      publicFolderUrl: "",
      privateFolderUrl: "",
      modelFolders: [],
      coverFileName: "cover.jpg",
      themeRandomThumb: true,
      placeholderUrl: "",
      cardLoadSec: 0,
    },
    contactEmail: MEMBER_EMAIL_PLACEHOLDER,
    brandLogoText: IS_MEMBER_TEMPLATE ? MEMBER_BRAND : SAMPLE_BRAND,
    siteTitle: IS_MEMBER_TEMPLATE ? MEMBER_SITE_TITLE : SAMPLE_SITE_TITLE,
    modelLabels: {},
    modelNameSize: 10,
    ctaText: SAMPLE_CTA,
    emailButtonText: SAMPLE_EMAIL_BUTTON,
    privatePassword: IS_MEMBER_TEMPLATE ? MEMBER_PRIVATE_PASSWORD : "0000",
    privateAccessMessage: SAMPLE_PRIVATE_MESSAGE,
    introHomepageUrl: "",
    inquirySubject: SAMPLE_INQUIRY_SUBJECT,
    inquiryBody: SAMPLE_INQUIRY_BODY,
    inquiryAppsScriptUrl: "",
    themeAccent: "#e8d5a3",
    footerText: "",
  };
}

function merge(raw: unknown): MenuConfig {
  const base = defaultMenuConfig();
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Partial<MenuConfig>;
  if (typeof src.coverTitle === "string") base.coverTitle = src.coverTitle;
  if (typeof src.coverSub === "string") base.coverSub = src.coverSub;
  if (typeof src.coverTitleSize === "number")
    base.coverTitleSize = clampSize(src.coverTitleSize);
  if (typeof src.coverSubSize === "number")
    base.coverSubSize = clampSize(src.coverSubSize);
  if (typeof src.page2Title === "string") base.page2Title = src.page2Title;
  if (base.page2Title === "Travel Experience") {
    base.page2Title = "Welcome to My Travel World";
  }
  if (typeof src.page2Sub === "string") base.page2Sub = src.page2Sub;
  if (base.page2Sub === "Choose where you want to go.") {
    base.page2Sub = "Go to Another World.\nDiscover Your Next World.";
  }
  if (typeof src.page2TitleSize === "number")
    base.page2TitleSize = clampSize(src.page2TitleSize);
  if (typeof src.page2SubSize === "number")
    base.page2SubSize = clampSize(src.page2SubSize);
  if (typeof src.page4Title === "string") base.page4Title = src.page4Title;
  if (base.page4Title === "Make Money Wishes Real" || base.page4Title === "Make Experience Wishes Real") {
    base.page4Title = "MWR Travel Membership Guide";
  }
  if (typeof src.page4TitleSize === "number")
    base.page4TitleSize = clampSize(src.page4TitleSize);
  if (typeof src.page4GuideTitle === "string")
    base.page4GuideTitle =
      src.page4GuideTitle === "여행비 절약" ? "" : src.page4GuideTitle;
  if (typeof src.page4GuideBody === "string")
    base.page4GuideBody = src.page4GuideBody;
  if (Array.isArray(src.page4GuidePosts)) {
    base.page4GuidePosts = src.page4GuidePosts.filter(
      (s): s is string => typeof s === "string",
    );
  } else if (typeof src.page4GuideBody === "string" && src.page4GuideBody.trim()) {
    base.page4GuidePosts = src.page4GuideBody
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (
    base.page4GuidePosts.length === 1 &&
    base.page4GuidePosts[0]?.includes("회원 전용 여행 서비스를 활용하여")
  ) {
    base.page4GuidePosts = [...DEFAULT_PAGE4_GUIDE_POSTS];
    base.page4GuideBody = DEFAULT_PAGE4_GUIDE_POSTS.join("\n\n");
  }
  if (typeof src.page4GuideSize === "number")
    base.page4GuideSize = clampMenuType(src.page4GuideSize, 12, 36);
  if (src.page4Captions && typeof src.page4Captions === "object") {
    (["Window_01", "Window_02", "Window_03"] as const).forEach((k) => {
      if (typeof src.page4Captions?.[k] === "string") {
        base.page4Captions[k] = src.page4Captions[k];
      }
    });
  }
  if (src.page4Ctas && typeof src.page4Ctas === "object") {
    (["Window_01", "Window_02", "Window_03"] as const).forEach((k) => {
      if (typeof src.page4Ctas?.[k] === "string") {
        base.page4Ctas[k] = src.page4Ctas[k];
      }
    });
  }
  if (src.page4Details && typeof src.page4Details === "object") {
    (["Window_01", "Window_02", "Window_03"] as const).forEach((k) => {
      if (typeof src.page4Details?.[k] === "string") {
        base.page4Details[k] = src.page4Details[k];
      }
    });
  }
  if (src.page4 && typeof src.page4 === "object") {
    for (const id of PAGE4_MENU_IDS) {
      const item = src.page4[id];
      if (!item) continue;
      if (typeof item.label === "string") base.page4[id].label = item.label;
      if (typeof item.hint === "string") base.page4[id].hint = item.hint;
      if (typeof item.url === "string") base.page4[id].url = item.url;
    }
  }
  if (typeof src.page4MenuLabelSize === "number")
    base.page4MenuLabelSize = clampMenuType(src.page4MenuLabelSize, 8, 36);
  if (typeof src.page4MenuHintSize === "number")
    base.page4MenuHintSize = clampMenuType(src.page4MenuHintSize, 7, 20);
  if (typeof src.page5Title === "string") base.page5Title = src.page5Title;
  if (typeof src.page5Sub === "string") base.page5Sub = src.page5Sub;
  if (typeof src.page5TitleSize === "number")
    base.page5TitleSize = clampSize(src.page5TitleSize);
  if (typeof src.page5SubSize === "number")
    base.page5SubSize = clampSize(src.page5SubSize);
  const introUrl = base.page4.Menu_02?.url ?? "";
  if (
    !introUrl.trim() ||
    /mwrlife\.com\/?$/i.test(introUrl.replace(/\/+$/, "")) ||
    introUrl.includes("www.mwrlife.com")
  ) {
    base.page4.Menu_02.url = PAGE4_MENU_EXTERNAL_URLS.Menu_02 ?? "";
    if (
      !base.page4.Menu_02.hint ||
      base.page4.Menu_02.hint.includes("공식 홈페이지")
    ) {
      base.page4.Menu_02.hint = PAGE4_MENU_HINTS.Menu_02 ?? "소개 영상";
    }
  }
  if (src.join && typeof src.join === "object") {
    (["signup", "guide", "video", "membership"] as const).forEach((k) => {
      if (typeof src.join?.[k] === "string") base.join[k] = src.join[k];
    });
    if (
      !base.join.signup ||
      base.join.signup === "about:blank" ||
      !/^https?:\/\//i.test(base.join.signup) ||
      base.join.signup.includes("moonjoonpil") ||
      base.join.signup === "http://mwrlife.com/joinhome"
    ) {
      base.join.signup = MWR_SIGNUP_URL;
    }
  }
  if (src.sourceDownload && typeof src.sourceDownload === "object") {
    if (typeof src.sourceDownload.password === "string") {
      base.sourceDownload.password = src.sourceDownload.password;
    }
    if (typeof src.sourceDownload.fileId === "string") {
      base.sourceDownload.fileId = src.sourceDownload.fileId;
    }
    if (typeof src.sourceDownload.url === "string") {
      base.sourceDownload.url = src.sourceDownload.url;
    }
  }
  if (src.frameTiming && typeof src.frameTiming === "object") {
    if (typeof src.frameTiming.zoomSec === "number") {
      base.frameTiming.zoomSec = clampFrameZoom(src.frameTiming.zoomSec);
    }
    if (typeof src.frameTiming.holdSec === "number") {
      base.frameTiming.holdSec = clampFrameHold(src.frameTiming.holdSec);
    }
    if (typeof src.frameTiming.exitSec === "number") {
      base.frameTiming.exitSec = clampFrameExit(src.frameTiming.exitSec);
    }
  }
  if (src.album && typeof src.album === "object") {
    if (typeof src.album.turnSec === "number") {
      const next = clampAlbumTurn(src.album.turnSec);
      base.album.turnSec = src.album.turnSec <= 0.8 ? 1.6 : next;
    }
    if (typeof src.album.autoPlay === "boolean") {
      base.album.autoPlay = src.album.autoPlay;
    }
    if (typeof src.album.autoSec === "number") {
      base.album.autoSec = clampAlbumAuto(src.album.autoSec);
    }
    if (typeof src.album.bg === "string" && src.album.bg.trim()) {
      base.album.bg = src.album.bg;
    }
    if (typeof src.album.gapPx === "number") {
      base.album.gapPx = clampAlbumGap(src.album.gapPx);
    }
  }
  if (src.heroBg && typeof src.heroBg === "object") {
    if (Array.isArray(src.heroBg.urls)) {
      base.heroBg.urls = normalizeHeroUrls(src.heroBg.urls);
    }
    if (typeof src.heroBg.autoPlay === "boolean") {
      base.heroBg.autoPlay = src.heroBg.autoPlay;
    }
    if (typeof src.heroBg.intervalSec === "number") {
      base.heroBg.intervalSec = clampHeroInterval(src.heroBg.intervalSec);
    }
    if (typeof src.heroBg.fadeSec === "number") {
      base.heroBg.fadeSec = clampHeroFade(src.heroBg.fadeSec);
    }
    if (typeof src.heroBg.cardDelaySec === "number") {
      base.heroBg.cardDelaySec = clampHeroCardDelay(src.heroBg.cardDelaySec);
    }
    if (typeof src.heroBg.overlay === "number") {
      base.heroBg.overlay = clampHeroOverlay(src.heroBg.overlay);
    }
  }
  if (src.destGallery && typeof src.destGallery === "object") {
    if (typeof src.destGallery.overlay === "number") {
      base.destGallery.overlay = clampHeroOverlay(src.destGallery.overlay);
    }
    if (typeof src.destGallery.delaySec === "number") {
      base.destGallery.delaySec = clampDestDelay(src.destGallery.delaySec);
    }
    if (
      src.destGallery.frameStyle === "gold" ||
      src.destGallery.frameStyle === "thin" ||
      src.destGallery.frameStyle === "soft"
    ) {
      base.destGallery.frameStyle = src.destGallery.frameStyle;
    }
    base.destGallery.mobileMode = "scroll";
    if (Array.isArray(src.destGallery.heroes)) {
      base.destGallery.heroes = normalizeDestHeroes(src.destGallery.heroes);
    }
    if (typeof src.destGallery.rootFolderUrl === "string") {
      base.destGallery.rootFolderUrl = src.destGallery.rootFolderUrl;
    }
    if (typeof src.destGallery.publicFolderUrl === "string") {
      base.destGallery.publicFolderUrl = src.destGallery.publicFolderUrl;
    } else if (base.destGallery.rootFolderUrl && !base.destGallery.publicFolderUrl) {
      base.destGallery.publicFolderUrl = base.destGallery.rootFolderUrl;
    }
    if (typeof src.destGallery.privateFolderUrl === "string") {
      base.destGallery.privateFolderUrl = src.destGallery.privateFolderUrl;
    }
    if (Array.isArray(src.destGallery.modelFolders)) {
      base.destGallery.modelFolders = src.destGallery.modelFolders
        .filter((row) => row && typeof row === "object")
        .map((row) => ({
          key: typeof row.key === "string" ? row.key : "",
          folderUrl: typeof row.folderUrl === "string" ? row.folderUrl : "",
        }));
    }
    if (typeof src.destGallery.coverFileName === "string" && src.destGallery.coverFileName.trim()) {
      base.destGallery.coverFileName = src.destGallery.coverFileName.trim();
    }
    if (typeof src.destGallery.themeRandomThumb === "boolean") {
      base.destGallery.themeRandomThumb = src.destGallery.themeRandomThumb;
    }
    if (typeof src.destGallery.placeholderUrl === "string") {
      base.destGallery.placeholderUrl = src.destGallery.placeholderUrl;
    }
    if (typeof src.destGallery.cardLoadSec === "number") {
      base.destGallery.cardLoadSec = clampCardLoad(src.destGallery.cardLoadSec);
    }
  }
  if (typeof src.contactEmail === "string") {
    const email = src.contactEmail.trim();
    if (email) base.contactEmail = email;
  }
  if (typeof src.brandLogoText === "string") base.brandLogoText = src.brandLogoText;
  if (typeof src.siteTitle === "string") base.siteTitle = src.siteTitle;
  if (src.modelLabels && typeof src.modelLabels === "object") {
    const labels: Record<string, string> = {};
    for (const [k, v] of Object.entries(src.modelLabels)) {
      if (typeof v === "string") labels[k] = v;
    }
    base.modelLabels = labels;
  }
  if (typeof src.modelNameSize === "number") {
    base.modelNameSize = clampMenuType(src.modelNameSize, 8, 22);
  }
  if (typeof src.ctaText === "string") base.ctaText = src.ctaText;
  if (typeof src.emailButtonText === "string") {
    base.emailButtonText = src.emailButtonText;
  }
  if (typeof src.privatePassword === "string" && src.privatePassword.trim()) {
    base.privatePassword = src.privatePassword.trim();
  }
  if (typeof src.privateAccessMessage === "string") {
    base.privateAccessMessage = src.privateAccessMessage;
  }
  if (typeof src.introHomepageUrl === "string") {
    base.introHomepageUrl = src.introHomepageUrl.trim();
  }
  if (typeof src.inquirySubject === "string") {
    base.inquirySubject = src.inquirySubject;
  }
  if (typeof src.inquiryBody === "string") {
    base.inquiryBody = src.inquiryBody;
  }
  if (typeof src.inquiryAppsScriptUrl === "string") {
    base.inquiryAppsScriptUrl = src.inquiryAppsScriptUrl.trim();
  }
  if (typeof src.themeAccent === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(src.themeAccent.trim())) {
    base.themeAccent = src.themeAccent.trim();
  }
  if (typeof src.footerText === "string") base.footerText = src.footerText;
  return base;
}

export function loadMenuConfig(): MenuConfig {
  if (typeof window === "undefined") return defaultMenuConfig();
  try {
    const raw = window.localStorage.getItem(MENU_CONFIG_STORAGE_KEY);
    if (!raw) return defaultMenuConfig();
    return merge(JSON.parse(raw));
  } catch {
    return defaultMenuConfig();
  }
}

export function saveMenuConfig(next: MenuConfig): void {
  window.localStorage.setItem(MENU_CONFIG_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function resetMenuConfig(): MenuConfig {
  window.localStorage.removeItem(MENU_CONFIG_STORAGE_KEY);
  const next = defaultMenuConfig();
  window.dispatchEvent(new Event(EVENT));
  return next;
}

export function useMenuConfig(): MenuConfig {
  const [config, setConfig] = useState<MenuConfig>(() =>
    typeof window === "undefined" ? defaultMenuConfig() : loadMenuConfig(),
  );
  useEffect(() => {
    const refresh = () => setConfig(loadMenuConfig());
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return config;
}
