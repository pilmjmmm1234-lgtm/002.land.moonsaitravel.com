"use client";

import { Link, useRouterState } from "@tanstack/react-router";

const ITEMS = [
  { to: "/info", label: "안내" },
  { to: "/info/membership", label: "멤버십" },
  { to: "/info/faq", label: "확인사항" },
] as const;

export function InfoNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="소개 페이지"
      className="mb-8 flex flex-wrap items-center justify-center gap-2"
    >
      {ITEMS.map((item) => {
        const active =
          item.to === "/info" ? pathname === "/info" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-colors duration-(--motion-fast) ${
              active
                ? "border-fg/30 bg-fg/10 text-fg"
                : "border-fg/12 text-fg/65 hover:border-fg/25 hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
