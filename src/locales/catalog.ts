export type LocaleOption = {
  code: string;
  native: string;
};

/** Shown first on Choose Your Language. */
export const PRIMARY_LOCALES: LocaleOption[] = [
  { code: "en", native: "English" },
  { code: "ko", native: "한국어" },
  { code: "ja", native: "日本語" },
  { code: "zh", native: "中文" },
  { code: "es", native: "Español" },
  { code: "mn", native: "Монгол хэл" },
  { code: "vi", native: "Tiếng Việt" },
  { code: "th", native: "ไทย" },
];

/** Extra languages — add a JSON file with the same code to activate. */
export const MORE_LOCALES: LocaleOption[] = [
  { code: "id", native: "Bahasa Indonesia" },
  { code: "fr", native: "Français" },
  { code: "de", native: "Deutsch" },
  { code: "pt", native: "Português" },
  { code: "it", native: "Italiano" },
  { code: "ru", native: "Русский" },
  { code: "ar", native: "العربية" },
  { code: "hi", native: "हिन्दी" },
  { code: "fil", native: "Filipino" },
];

export const ALL_LOCALES: LocaleOption[] = [...PRIMARY_LOCALES, ...MORE_LOCALES];

export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "travel-ui-locale";

export function isKnownLocale(code: string): boolean {
  return ALL_LOCALES.some((item) => item.code === code);
}