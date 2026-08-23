"use client";

import { useState } from "react";
import { useMenuConfig } from "@/lib/menu-config";
import { resolveUiCopy, useI18n } from "@/lib/i18n";
import { SAMPLE_CTA, SAMPLE_EMAIL_BUTTON } from "@/content/site-profile";

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function BrandMark({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="size-9 sm:size-10"
      style={{ color }}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        opacity="0.55"
      />
      <path
        d="M31.5 12.8c-6.4 1.2-11.2 6.9-11.2 13.7 0 1.6.3 3.2.8 4.6 4.4-1.8 7.5-6.1 7.5-11.2 0-2.6-.8-5-2.2-7.1Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M9.5 29.5 16 27.2l3.4 1.1-1.6 2.4 6.8-1.1 8.6 3.8-2.2 1.2-7.4-2.4-6.2 3.6z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

export function LandingContactCta() {
  const { brandLogoText, ctaText, themeAccent, footerText, emailButtonText } =
    useMenuConfig();
  const { t, locale } = useI18n();
  const accent = themeAccent || "#e8d5a3";
  const cta = resolveUiCopy(ctaText, SAMPLE_CTA, t("ctaText"));
  const buttonLabel = resolveUiCopy(
    emailButtonText,
    SAMPLE_EMAIL_BUTTON,
    t("contactButton"),
  );
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [note, setNote] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) {
      setStatus("error");
      setNote(t("inquiryNeedEmail"));
      return;
    }
    setStatus("sending");
    setNote("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        if (data.error === "wait") setNote(t("inquiryWait"));
        else if (data.error === "mail_not_configured" || data.error === "missing_from")
          setNote(t("inquiryNoMail"));
        else setNote(t("inquiryError"));
        return;
      }
      setStatus("done");
      setNote(t("inquiryDone"));
      setEmail("");
    } catch {
      setStatus("error");
      setNote(t("inquiryError"));
    }
  };

  return (
    <section
      aria-label="Email request"
      className="mx-auto mt-4 w-full max-w-[54rem] shrink-0 px-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mt-5"
    >
      <div className="rounded-md border border-white/12 bg-black/55 px-6 py-4 text-center shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-[6px] sm:px-10 sm:py-5">
        <div className="flex flex-col items-center">
          <BrandMark color={accent} />
          <p
            className="mt-2.5 font-display text-[0.68rem] font-semibold tracking-[0.28em] sm:text-[0.74rem] sm:tracking-[0.32em]"
            style={{ color: accent }}
          >
            {brandLogoText || "MOON'S AI TRAVEL"}
          </p>
        </div>

        <p
          className="mx-auto mt-3 w-full font-display text-[0.9rem] font-normal leading-[1.5] text-[#f4ead6] sm:whitespace-nowrap sm:text-[1rem]"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.45)" }}
        >
          {cta}
        </p>

        <form
          className="mx-auto mt-4 flex w-full max-w-[28rem] flex-col items-center gap-2.5 sm:flex-row sm:gap-2"
          onSubmit={(e) => void onSubmit(e)}
        >
          <label className="sr-only" htmlFor="inquiry-email">
            {t("inquiryEmail")}
          </label>
          <input
            id="inquiry-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("inquiryEmail")}
            className="min-h-10 w-full rounded-full border border-white/18 bg-black/50 px-4 text-center text-[0.82rem] text-[#f4ead6] outline-none placeholder:text-white/45 sm:flex-1 sm:text-left"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex min-h-10 w-full shrink-0 cursor-pointer items-center justify-center rounded-full px-5 text-[0.82rem] font-medium tracking-[0.08em] transition-opacity disabled:opacity-55 sm:w-auto"
            style={{
              border: `1px solid ${accent}73`,
              background: `${accent}1f`,
              color: accent,
            }}
          >
            {status === "sending" ? t("inquirySending") : buttonLabel}
          </button>
        </form>
        {note ? (
          <p className="mt-2.5 text-[0.72rem] text-[#f4ead6]/80">{note}</p>
        ) : null}
      </div>
      {footerText.trim() ? (
        <p className="mt-3 text-center text-[0.68rem] text-white/50">
          {footerText}
        </p>
      ) : null}
    </section>
  );
}