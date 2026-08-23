"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  PAGE4_MENU_IDS,
  PAGE4_MENU_ROUTES,
  type Page4MenuId,
} from "@/content/04_Page/menus";
import { useMenuConfig } from "@/lib/menu-config";
import { fitTypeSize, useIsMobile } from "@/lib/use-is-mobile";
import type { DriveMenuListing, DriveOpenItem } from "@/lib/drive/types";

const REFRESH_MS = 45_000;

type Page4BottomMenusProps = {
  compact?: boolean;
  activeMenuId?: Page4MenuId;
};

/**
 * Bottom menu row (6 items): external links, Drive folders, /join.
 */
export function Page4BottomMenus({
  compact = false,
  activeMenuId,
}: Page4BottomMenusProps) {
  const navigate = useNavigate();
  const menuConfig = useMenuConfig();
  const mobile = useIsMobile(1024);
  const cacheRef = useRef<Record<string, DriveOpenItem[]>>({});
  const [entered, setEntered] = useState(false);

  const refreshAll = useCallback(async () => {
    await Promise.all(
      PAGE4_MENU_IDS.map(async (menuId) => {
        if (PAGE4_MENU_ROUTES[menuId] || menuConfig.page4[menuId]?.url.trim())
          return;
        try {
          const res = await fetch(`/api/drive/menu/${menuId}`, {
            cache: "no-store",
          });
          if (!res.ok) return;
          const data = (await res.json()) as DriveMenuListing;
          cacheRef.current[menuId] = data.items ?? [];
        } catch {
          /* keep last */
        }
      }),
    );
  }, [menuConfig]);

  useEffect(() => {
    void refreshAll();
    const id = window.setInterval(() => void refreshAll(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refreshAll]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setEntered(true);
      return;
    }
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  const openMenu = async (menuId: Page4MenuId) => {
    const external = menuConfig.page4[menuId]?.url.trim();
    if (external) {
      window.open(external, "_blank", "noopener,noreferrer");
      return;
    }

    const route = PAGE4_MENU_ROUTES[menuId];
    if (route) {
      void navigate({ to: route });
      return;
    }

    try {
      const res = await fetch(`/api/drive/menu/${menuId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as DriveMenuListing;
        cacheRef.current[menuId] = data.items ?? [];
      }
    } catch {
      /* use cache */
    }

    const items = cacheRef.current[menuId] ?? [];
    const first = items[0];
    if (!first?.src) return;
    window.open(first.src, "_blank", "noopener,noreferrer");
  };

  return (
    <nav
      aria-label="Page menus"
      className={
        compact
          ? "mx-auto w-full max-w-none px-0 pb-0 pt-0"
          : "mx-auto w-full max-w-5xl px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-10 sm:pt-6"
      }
    >
      <div
        aria-hidden="true"
        className={
          compact
            ? "mx-auto mb-1.5 h-px w-full max-w-sm origin-center bg-linear-to-r from-transparent via-fg/18 to-transparent"
            : "mx-auto mb-5 h-px w-full max-w-md origin-center bg-linear-to-r from-transparent via-fg/18 to-transparent transition-transform duration-700 ease-(--ease-smooth-out) sm:mb-6"
        }
        style={{
          transform: entered ? "scaleX(1)" : "scaleX(0.2)",
          opacity: entered ? 1 : 0,
          transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease",
        }}
      />

      {/* Mobile: 1 per row. PC: 3 per row, 2 rows */}
      <div
        className={
          compact
            ? "grid grid-cols-1 gap-3 min-[769px]:grid-cols-3 min-[769px]:gap-2 sm:min-[769px]:gap-2.5 md:min-[769px]:gap-3"
            : "grid grid-cols-1 gap-3 min-[769px]:grid-cols-3 sm:min-[769px]:gap-3.5"
        }
      >
        {PAGE4_MENU_IDS.map((menuId, i) => (
          <MenuButton
            key={menuId}
            label={menuConfig.page4[menuId]?.label ?? ""}
            hint={menuConfig.page4[menuId]?.hint}
            labelPx={fitTypeSize(
              menuConfig.page4MenuLabelSize ?? 12,
              mobile,
              16,
            )}
            hintPx={fitTypeSize(menuConfig.page4MenuHintSize ?? 8, mobile, 11)}
            index={i}
            entered={entered}
            compact={compact}
            mobile={mobile}
            active={activeMenuId === menuId}
            onClick={() => void openMenu(menuId)}
          />
        ))}
      </div>
    </nav>
  );
}

function MenuButton({
  label,
  hint,
  labelPx,
  hintPx,
  index,
  entered,
  compact,
  mobile,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  labelPx: number;
  hintPx: number;
  index: number;
  entered: boolean;
  compact?: boolean;
  mobile?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  const delay = 80 + index * 70;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        mobile
          ? "group relative h-[3.25rem] w-full overflow-hidden rounded-sm px-3"
          : compact
            ? "group relative h-14 w-full overflow-hidden rounded-sm sm:h-16"
            : "group relative h-12 w-full overflow-hidden rounded-sm sm:h-[3.25rem]"
      }
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 550ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 550ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-sm opacity-90 transition-opacity duration-(--motion-fast) group-hover:opacity-100"
        style={{
          background: active
            ? "linear-gradient(155deg, color-mix(in oklab, var(--color-fg) 48%, transparent) 0%, color-mix(in oklab, var(--color-accent) 40%, transparent) 100%)"
            : "linear-gradient(155deg, color-mix(in oklab, var(--color-fg) 38%, transparent) 0%, color-mix(in oklab, var(--color-fg) 10%, transparent) 45%, color-mix(in oklab, var(--color-accent) 32%, transparent) 100%)",
        }}
      />

      <span
        className={
          active
            ? "absolute inset-px flex items-center justify-center overflow-hidden rounded-[3px] bg-bg-elevated/95 backdrop-blur-sm"
            : "absolute inset-px flex items-center justify-center overflow-hidden rounded-[3px] bg-bg-elevated/90 backdrop-blur-sm transition-[background-color,box-shadow,transform] duration-(--motion-emphasis) ease-(--ease-smooth-out) group-hover:-translate-y-0.5 group-hover:bg-bg-elevated group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.38)] group-active:translate-y-0 group-active:scale-[0.97]"
        }
        style={{
          boxShadow: active
            ? "inset 0 1px 0 color-mix(in oklab, var(--color-fg) 14%, transparent), 0 0 0 1px color-mix(in oklab, var(--color-accent) 28%, transparent)"
            : "inset 0 1px 0 color-mix(in oklab, var(--color-fg) 8%, transparent)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-linear-to-r from-transparent via-fg/12 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-(--ease-smooth-out) group-hover:translate-x-[220%] group-hover:opacity-100"
        />

        <span className="relative z-[1] flex max-w-[96%] flex-col items-center justify-center px-1 text-center">
          <span
            className={`font-display font-semibold leading-tight tracking-normal whitespace-nowrap break-keep ${active ? "text-fg" : "text-fg/88"}`}
            style={{ fontSize: `${labelPx}px` }}
          >
            {label}
          </span>
          {hint ? (
            <span
              className="mt-1 leading-tight tracking-wide text-fg/55"
              style={{ fontSize: `${hintPx}px` }}
            >
              {hint}
            </span>
          ) : null}
        </span>

        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-3 bottom-0 h-px bg-linear-to-r from-transparent via-accent/45 to-transparent transition-opacity duration-(--motion-fast) group-hover:opacity-100 ${active ? "opacity-100" : "opacity-50"}`}
        />
      </span>
    </button>
  );
}
