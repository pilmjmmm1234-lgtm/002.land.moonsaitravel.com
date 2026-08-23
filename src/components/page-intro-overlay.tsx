"use client";

import { useEffect, useState, type ReactNode } from "react";

type Phase = "wait" | "hold" | "out" | "gone";

type PageIntroOverlayProps = {
  src: string;
  holdMs?: number;
  fadeMs?: number;
  onReveal?: () => void;
  children?: ReactNode;
};

/**
 * Fixed hero photo, then a slow fade so the page content can appear.
 * No zoom, slide, or video — still image only.
 */
export function PageIntroOverlay({
  src,
  holdMs = 2600,
  fadeMs = 1200,
  onReveal,
  children,
}: PageIntroOverlayProps) {
  const [phase, setPhase] = useState<Phase>("wait");

  useEffect(() => {
    if (phase !== "hold") return;
    const id = window.setTimeout(() => setPhase("out"), holdMs);
    return () => window.clearTimeout(id);
  }, [phase, holdMs]);

  useEffect(() => {
    if (phase !== "out") return;
    onReveal?.();
    const id = window.setTimeout(() => setPhase("gone"), fadeMs);
    return () => window.clearTimeout(id);
  }, [phase, fadeMs, onReveal]);

  if (phase === "gone") return null;

  const fading = phase === "out";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 bg-bg"
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? `opacity ${fadeMs}ms ease` : undefined,
      }}
      aria-hidden="true"
    >
      <img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        ref={(el) => {
          if (el?.complete) setPhase((p) => (p === "wait" ? "hold" : p));
        }}
        onLoad={() => setPhase((p) => (p === "wait" ? "hold" : p))}
        onError={() => {
          onReveal?.();
          setPhase("gone");
        }}
        className="h-full w-full object-cover object-center"
      />
      {children ? (
        <div className="absolute inset-x-0 top-[max(1.5rem,var(--grok-banner-h,1rem))] px-5 sm:px-8">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export const SITE_HERO_IMAGE = "/images/hero-travel.jpg";
