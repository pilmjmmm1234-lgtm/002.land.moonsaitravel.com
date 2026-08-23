"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SiteMenu } from "@/components/site-menu";
import { useMenuConfig } from "@/lib/menu-config";

function pickStart(len: number): number {
  if (len <= 1) return 0;
  return Math.floor(Math.random() * len);
}

export function LandingStage({ children }: { children: ReactNode }) {
  const { heroBg } = useMenuConfig();
  const slides = useMemo(
    () => heroBg.urls.map((u) => u.trim()).filter(Boolean),
    [heroBg.urls],
  );
  const [shown, setShown] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const shownRef = useRef(0);

  useEffect(() => {
    const start = pickStart(Math.max(slides.length, 1));
    setShown(start);
    shownRef.current = start;
    setIncoming(null);
  }, [slides.length]);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    if (!heroBg.autoPlay || slides.length < 2) return;
    const hold = Math.round(heroBg.intervalSec * 1000);
    const fade = Math.round(Math.min(heroBg.fadeSec, 1.2) * 1000);
    let fadeTimer: number | null = null;
    const id = window.setInterval(() => {
      const next = (shownRef.current + 1) % slides.length;
      setIncoming(next);
      fadeTimer = window.setTimeout(() => {
        setShown(next);
        shownRef.current = next;
        setIncoming(null);
      }, fade);
    }, hold);
    return () => {
      window.clearInterval(id);
      if (fadeTimer !== null) window.clearTimeout(fadeTimer);
    };
  }, [heroBg.autoPlay, heroBg.intervalSec, heroBg.fadeSec, slides.length]);

  const fadeMs = Math.round(Math.min(heroBg.fadeSec, 1.2) * 1000);
  const overlay = Math.min(70, Math.max(10, heroBg.overlay)) / 100;

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {slides.map((src, i) => {
          const active = i === shown || i === incoming;
          if (!active) return null;
          const visible = incoming === null ? i === shown : i === incoming;
          return (
            <img
              key={`${src}-${i}`}
              src={src}
              alt=""
              draggable={false}
              decoding="async"
              loading={i === shown ? "eager" : "lazy"}
              fetchPriority={i === shown ? "high" : "auto"}
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{
                opacity: visible ? 1 : 0,
                transition: `opacity ${fadeMs}ms ease`,
              }}
            />
          );
        })}
        <div
          className="absolute inset-0"
          style={{ background: `rgba(7, 8, 10, ${overlay})` }}
        />
      </div>
      <SiteMenu variant="landing" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[79.2rem] flex-col px-5 pb-3 pt-[max(1rem,calc(var(--grok-banner-h,0.75rem)+0.15rem))] sm:px-8 sm:pt-[max(1.05rem,calc(var(--grok-banner-h,1rem)+0.15rem))]">
        {children}
      </div>
    </main>
  );
}
