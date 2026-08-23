"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const itemClass =
  "block w-full px-4 py-3.5 text-left text-[1rem] font-medium text-fg transition-colors duration-(--motion-fast) hover:bg-fg/8 focus-visible:bg-fg/8 focus-visible:outline-none min-[769px]:py-3 min-[769px]:text-sm";

const cornerBtn =
  "fixed top-[max(1rem,var(--grok-banner-h,0.5rem))] z-50 inline-flex min-h-10 items-center justify-center rounded-full border border-fg/20 bg-bg/25 px-3.5 text-[0.72rem] font-medium tracking-[0.12em] text-fg backdrop-blur-sm transition-colors duration-(--motion-fast) hover:bg-bg/40 sm:top-[max(1.15rem,var(--grok-banner-h,0.75rem))] sm:min-h-11";

type SiteMenuProps = {
  variant?: "landing" | "info" | "admin";
};

export function SiteBackLink({
  to,
  params,
  children = "← Back",
}: {
  to: "/experience/$destination" | "/";
  params?: { destination: string };
  children?: ReactNode;
}) {
  if (to === "/experience/$destination" && params) {
    return (
      <Link
        to="/experience/$destination"
        params={params}
        className={`${cornerBtn} left-4 sm:left-6`}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link to="/" className={`${cornerBtn} left-4 sm:left-6`}>
      {children}
    </Link>
  );
}

export function SiteMenu({ variant: _variant = "landing" }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { t, openPicker } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  return (
    <>
      <button
        type="button"
        aria-label={open ? t("closeMenu") : t("menu")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="fixed top-[max(1rem,var(--grok-banner-h,0.5rem))] right-4 z-50 flex size-10 shrink-0 items-center justify-center rounded-full border border-fg/20 bg-bg/25 text-fg backdrop-blur-sm transition-colors duration-(--motion-fast) ease-(--ease-smooth-out) hover:bg-bg/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/50 sm:top-[max(1.15rem,var(--grok-banner-h,0.75rem))] sm:right-6 sm:size-11"
      >
        {open ? (
          <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="fixed inset-0 z-40 cursor-default bg-bg/25"
            onClick={close}
          />

          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={t("menu")}
            className="fixed top-[max(3.75rem,calc(var(--grok-banner-h,0px)+2.85rem))] right-4 z-50 w-56 overflow-hidden rounded-md border border-fg/15 bg-bg/92 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:right-6 sm:w-60"
          >
            <div className="flex items-center justify-between border-b border-fg/10 px-4 py-3">
              <span className="text-xs font-medium tracking-[0.12em] text-fg-muted">
                {t("menu")}
              </span>
              <button
                type="button"
                aria-label={t("closeMenu")}
                onClick={close}
                className="flex size-8 items-center justify-center rounded-full text-fg transition-colors duration-(--motion-fast) hover:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/50"
              >
                <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            <nav className="flex flex-col py-2 text-left" aria-label={t("menu")}>
              <Link to="/" onClick={close} className={itemClass}>
                {t("menuHome")}
              </Link>
              <button
                type="button"
                className={itemClass}
                onClick={() => {
                  close();
                  openPicker();
                }}
              >
                {t("language")}
              </button>
              <Link to="/" hash="image" onClick={close} className={itemClass}>
                {t("menuImage")}
              </Link>
              <Link
                to="/admin"
                onClick={close}
                className={itemClass}
                aria-label={t("menuAdmin")}
                title={t("menuAdmin")}
              >
                {t("menuAdmin")}
              </Link>
            </nav>
          </div>
        </>
      ) : null}
    </>
  );
}
