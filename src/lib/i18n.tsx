"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import fallbackEn from "@/locales/en.json";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isKnownLocale,
} from "@/locales/catalog";

export type LocaleKey = keyof typeof fallbackEn;
export type LocaleDict = Record<LocaleKey, string>;

const FALLBACK = fallbackEn as LocaleDict;

const localeModules = import.meta.glob("../locales/*.json") as Record<
  string,
  () => Promise<{ default: LocaleDict }>
>;

const cache = new Map<string, LocaleDict>([[DEFAULT_LOCALE, FALLBACK]]);

function mergeDict(partial: Partial<LocaleDict> | undefined): LocaleDict {
  const next = { ...FALLBACK };
  if (!partial) return next;
  for (const key of Object.keys(FALLBACK) as LocaleKey[]) {
    const value = partial[key];
    if (typeof value === "string" && value.trim()) next[key] = value;
  }
  return next;
}

export async function loadLocale(code: string): Promise<LocaleDict> {
  const lang = isKnownLocale(code) ? code : DEFAULT_LOCALE;
  const hit = cache.get(lang);
  if (hit) return hit;
  if (lang === DEFAULT_LOCALE) {
    cache.set(lang, FALLBACK);
    return FALLBACK;
  }
  const loader =
    localeModules[`../locales/${lang}.json`] ||
    localeModules[`/src/locales/${lang}.json`];
  if (!loader) {
    cache.set(lang, FALLBACK);
    return FALLBACK;
  }
  try {
    const mod = await loader();
    const dict = mergeDict(mod.default);
    cache.set(lang, dict);
    return dict;
  } catch {
    cache.set(lang, FALLBACK);
    return FALLBACK;
  }
}

function readStoredLocale(): string {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) || "";
    return isKnownLocale(stored) ? stored : "";
  } catch {
    return "";
  }
}

export function resolveUiCopy(
  adminValue: string | undefined,
  sampleEnglish: string,
  translated: string,
): string {
  const value = (adminValue || "").trim();
  if (!value || value === sampleEnglish) return translated;
  return value;
}

type I18nContextValue = {
  locale: string;
  ready: boolean;
  pickerOpen: boolean;
  hasStoredLocale: boolean;
  openPicker: () => void;
  closePicker: () => void;
  setLocale: (code: string) => Promise<void>;
  t: (key: LocaleKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [dict, setDict] = useState<LocaleDict>(FALLBACK);
  const [ready, setReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hasStoredLocale, setHasStoredLocale] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    if (!stored) {
      setHasStoredLocale(false);
      setPickerOpen(true);
      setReady(true);
      return;
    }
    setHasStoredLocale(true);
    void loadLocale(stored).then((next) => {
      setLocaleState(stored);
      setDict(next);
      document.documentElement.lang = stored;
      document.documentElement.dir = stored === "ar" ? "rtl" : "ltr";
      setReady(true);
    });
  }, []);

  const setLocale = useCallback(async (code: string) => {
    const lang = isKnownLocale(code) ? code : DEFAULT_LOCALE;
    const next = await loadLocale(lang);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    setHasStoredLocale(true);
    setLocaleState(lang);
    setDict(next);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    setPickerOpen(false);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      ready,
      pickerOpen,
      hasStoredLocale,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
      setLocale,
      t: (key) => dict[key] || FALLBACK[key] || key,
    }),
    [locale, ready, pickerOpen, hasStoredLocale, setLocale, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      ready: true,
      pickerOpen: false,
      hasStoredLocale: false,
      openPicker: () => undefined,
      closePicker: () => undefined,
      setLocale: async () => undefined,
      t: (key) => FALLBACK[key] || key,
    };
  }
  return ctx;
}