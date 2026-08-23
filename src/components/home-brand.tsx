"use client";

import { useMenuConfig } from "@/lib/menu-config";
import { fitTypeSize, useIsMobile } from "@/lib/use-is-mobile";

export function HomeBrand() {
  const mobile = useIsMobile();
  const { coverTitle, coverSub, coverTitleSize, coverSubSize } = useMenuConfig();
  const titlePx = fitTypeSize(coverTitleSize, mobile, 20);
  const subPx = fitTypeSize(coverSubSize, mobile, 12);

  return (
    <header className="z-10 flex items-start justify-between gap-4 max-[768px]:relative max-[768px]:px-0 max-[768px]:pt-0 min-[769px]:absolute min-[769px]:inset-x-0 min-[769px]:top-0 min-[769px]:px-5 min-[769px]:pt-[max(1.25rem,var(--grok-banner-h,0.75rem))] sm:min-[769px]:px-8 sm:min-[769px]:pt-[max(1.75rem,var(--grok-banner-h,1rem))]">
      <div className="min-w-0 text-left max-[768px]:pr-0 min-[769px]:pr-28 sm:min-[769px]:pr-32">
        <p
          className="font-bold leading-snug tracking-[0.06em] text-[var(--color-traveler)] drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] break-words sm:tracking-[0.1em]"
          style={{ fontSize: `${titlePx}px` }}
        >
          {coverTitle}
        </p>
        <p
          className="mt-1.5 max-w-[36rem] font-semibold leading-snug tracking-wide text-[var(--color-traveler-muted)] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] break-words sm:mt-2 sm:max-w-4xl"
          style={{ fontSize: `${subPx}px` }}
        >
          {coverSub}
        </p>
      </div>
    </header>
  );
}
