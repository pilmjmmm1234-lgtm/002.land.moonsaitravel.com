"use client";

import { useEffect, useState } from "react";

/** True when viewport is 768px wide or narrower. */
export function useIsMobile(maxWidth = 768): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${maxWidth}px)`).matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [maxWidth]);

  return mobile;
}

/** Keep admin desktop sizes on PC; cap them on mobile. */
export function fitTypeSize(
  desktopPx: number,
  isMobile: boolean,
  maxMobile: number,
): number {
  if (!isMobile || !Number.isFinite(desktopPx)) return desktopPx;
  return Math.min(desktopPx, maxMobile);
}
