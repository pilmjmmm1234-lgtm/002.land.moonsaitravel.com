"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";

type DestinationExperienceProps = {
  name: string;
  images: readonly string[];
};

const AUTO_MS = 7_000;
const FADE_MS = 1_100;

/** Shared 50% opacity for all transport controls so the photo stays primary. */
const btnClass =
  "opacity-50 transition-opacity duration-(--motion-fast) hover:opacity-80 focus-visible:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/40";

/**
 * Virtual travel experience viewer.
 * Auto-advance with bottom video-style controls: first / pause / last.
 * Side arrows keep one-by-one browsing.
 */
export function DestinationExperience({
  name,
  images,
}: DestinationExperienceProps) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState({ a: 0, b: 0, showA: true });
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef<number | null>(null);
  const fadingRef = useRef(false);
  const total = images.length;

  const clearAuto = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (total <= 1 || fadingRef.current) return;
      const target = ((next % total) + total) % total;
      if (target === index) return;

      fadingRef.current = true;
      setDisplay((d) => {
        if (d.showA) {
          return { a: d.a, b: target, showA: false };
        }
        return { a: target, b: d.b, showA: true };
      });
      setIndex(target);
      window.setTimeout(() => {
        fadingRef.current = false;
      }, FADE_MS);
    },
    [index, total],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goFirst = useCallback(() => goTo(0), [goTo]);
  const goLast = useCallback(() => goTo(total - 1), [goTo, total]);

  const toggleAuto = useCallback(() => {
    setAutoPlay((v) => !v);
  }, []);

  useEffect(() => {
    clearAuto();
    if (!autoPlay || total <= 1) return;
    timerRef.current = window.setTimeout(() => goTo(index + 1), AUTO_MS);
    return clearAuto;
  }, [index, total, goTo, clearAuto, autoPlay]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Home") goFirst();
      if (e.key === "End") goLast();
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggleAuto();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, goFirst, goLast, toggleAuto]);

  useEffect(() => {
    if (total === 0) return;
    for (const src of images) {
      const img = new Image();
      img.src = src;
    }
  }, [images, total]);

  if (total === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-fg-muted">
        No images
      </div>
    );
  }

  const srcA = images[display.a] ?? images[0]!;
  const srcB = images[display.b] ?? images[0]!;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <img
        src={srcA}
        alt=""
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-center select-none"
        style={{
          opacity: display.showA ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      />
      <img
        src={srcB}
        alt=""
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-center select-none"
        style={{
          opacity: display.showA ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-36 bg-linear-to-b from-bg/50 via-bg/20 to-transparent sm:h-44"
      />

      <header className="absolute inset-x-0 top-0 z-10 flex justify-center px-5 pt-[max(1.5rem,var(--grok-banner-h,1rem))] sm:pt-[max(2rem,var(--grok-banner-h,1.25rem))]">
        <h1 className="pr-24 text-center font-display text-lg font-semibold tracking-wide text-[var(--color-traveler)] sm:pr-28 sm:text-xl">
          {name}
        </h1>
      </header>

      {total > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={goPrev}
            className={`absolute top-1/2 left-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-fg/12 bg-bg/20 text-fg backdrop-blur-[6px] sm:left-5 sm:size-[1.65rem] ${btnClass}`}
          >
            <ChevronLeft className="size-3.5 sm:size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={goNext}
            className={`absolute top-1/2 right-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-fg/12 bg-bg/20 text-fg backdrop-blur-[6px] sm:right-5 sm:size-[1.65rem] ${btnClass}`}
          >
            <ChevronRight className="size-3.5 sm:size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
            <div
              className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-fg/10 bg-bg/20 px-1.5 py-1 opacity-50 shadow-[0_4px_16px_rgba(0,0,0,0.18)] backdrop-blur-[6px] transition-opacity duration-(--motion-fast) hover:opacity-80 sm:gap-1 sm:px-2 sm:py-1"
              role="group"
              aria-label="Playback"
            >
              <button
                type="button"
                aria-label="First"
                onClick={goFirst}
                className="flex size-[1.35rem] items-center justify-center rounded-full text-fg transition-colors duration-(--motion-fast) hover:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/40 sm:size-6"
              >
                <SkipBack className="size-3 sm:size-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>

              <button
                type="button"
                aria-label={autoPlay ? "Pause" : "Play"}
                onClick={toggleAuto}
                className="flex size-[1.35rem] items-center justify-center rounded-full text-fg transition-colors duration-(--motion-fast) hover:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/40 sm:size-6"
              >
                {autoPlay ? (
                  <Pause className="size-3 sm:size-3.5" strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Play className="size-3 sm:size-3.5" strokeWidth={1.5} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                aria-label="Last"
                onClick={goLast}
                className="flex size-[1.35rem] items-center justify-center rounded-full text-fg transition-colors duration-(--motion-fast) hover:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/40 sm:size-6"
              >
                <SkipForward className="size-3 sm:size-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
