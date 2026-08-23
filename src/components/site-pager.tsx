"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

const INFO_PAGES = [
  { to: "/info", label: "안내" },
  { to: "/info/membership", label: "멤버십" },
  { to: "/info/faq", label: "확인사항" },
] as const;

const btn =
  "fixed z-40 hidden size-11 items-center justify-center rounded-full border border-fg/20 bg-bg/25 text-fg backdrop-blur-sm transition-colors duration-(--motion-fast) hover:bg-bg/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/50 min-[769px]:flex sm:size-12";

function infoIndex(pathname: string): number {
  if (pathname === "/info" || pathname === "/info/") return 0;
  if (pathname.startsWith("/info/membership")) return 1;
  if (pathname.startsWith("/info/faq") || pathname === "/join") return 2;
  return -1;
}

export function SitePager() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const i = infoIndex(pathname);
  if (i < 0) return null;

  const prev = i > 0 ? INFO_PAGES[i - 1] : null;
  const next = i < INFO_PAGES.length - 1 ? INFO_PAGES[i + 1] : null;

  return (
    <>
      {prev ? (
        <Link
          to={prev.to}
          aria-label={`이전 페이지: ${prev.label}`}
          title={prev.label}
          className={`${btn} top-1/2 left-3 -translate-y-1/2 sm:left-5`}
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </Link>
      ) : null}
      {next ? (
        <Link
          to={next.to}
          aria-label={`다음 페이지: ${next.label}`}
          title={next.label}
          className={`${btn} top-1/2 right-3 -translate-y-1/2 sm:right-5`}
        >
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </Link>
      ) : null}
    </>
  );
}
