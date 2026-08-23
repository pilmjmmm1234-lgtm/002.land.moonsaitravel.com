"use client";

import { useState } from "react";
import { MORE_LOCALES, PRIMARY_LOCALES } from "@/locales/catalog";
import { useI18n } from "@/lib/i18n";

export function LanguagePicker() {
  const { pickerOpen, closePicker, setLocale, t, locale, hasStoredLocale } = useI18n();
  const [more, setMore] = useState(false);
  if (!pickerOpen) return null;

  const list = more ? [...PRIMARY_LOCALES, ...MORE_LOCALES] : PRIMARY_LOCALES;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("chooseLanguage")}
    >
      <div className="w-full max-w-md rounded-md border border-[#e8d5a3]/25 bg-[#0b0c10]/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <h2 className="text-center font-display text-[1.05rem] font-semibold tracking-wide text-white">
          {t("chooseLanguage")}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {list.map((item) => {
            const active = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => void setLocale(item.code)}
                className={`min-h-11 rounded-sm border px-3 text-sm tracking-wide ${
                  active
                    ? "border-[#e8d5a3]/50 bg-[#e8d5a3]/16 text-[#f3ead4]"
                    : "border-white/12 bg-white/4 text-white/90 hover:bg-white/8"
                }`}
              >
                {item.native}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="mt-4 w-full min-h-10 rounded-sm border border-white/12 text-[0.78rem] tracking-[0.12em] text-white/75 hover:bg-white/6"
        >
          {more ? t("chooseLanguage") : t("moreLanguages")}
        </button>
        {hasStoredLocale ? (
          <button
            type="button"
            onClick={closePicker}
            className="mt-2 w-full text-center text-[0.72rem] text-white/45 hover:text-white/70"
          >
            {t("close")}
          </button>
        ) : null}
      </div>
    </div>
  );
}