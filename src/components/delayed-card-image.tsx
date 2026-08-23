"use client";

import { useEffect, useState } from "react";

export function DelayedCardImage({
  src,
  fallback,
  delayMs,
}: {
  src: string | null;
  fallback?: string | null;
  delayMs: number;
}) {
  const first = src?.trim() || fallback?.trim() || "";
  const [shown, setShown] = useState(first);
  const [ready, setReady] = useState(delayMs <= 0 && Boolean(first));

  useEffect(() => {
    const next = src?.trim() || fallback?.trim() || "";
    setShown(next);
    if (delayMs <= 0) {
      setReady(Boolean(next));
      return;
    }
    setReady(false);
    const id = window.setTimeout(() => setReady(Boolean(next)), delayMs);
    return () => window.clearTimeout(id);
  }, [src, fallback, delayMs]);

  if (!shown || !ready) {
    return <div className="absolute inset-0 bg-black/25" />;
  }

  return (
    <img
      src={shown}
      alt=""
      loading="eager"
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
      onError={() => {
        const fb = fallback?.trim();
        if (fb && fb !== shown) setShown(fb);
      }}
      className="absolute inset-0 h-full w-full object-cover object-center"
    />
  );
}