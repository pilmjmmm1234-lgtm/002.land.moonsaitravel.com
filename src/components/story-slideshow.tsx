"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
} from "lucide-react";
import { useMenuConfig } from "@/lib/menu-config";
import { useIsMobile } from "@/lib/use-is-mobile";
import { galleryFrameClass } from "@/components/dest-scene-backdrop";
import { isPlayableVideoSrc } from "@/lib/drive/media";

type StorySlideshowProps = {
  storyName: string;
  images: readonly string[];
  destHero?: string;
  backTo:
    | { to: "/" }
    | {
        to: "/experience/$destination";
        params: { destination: string };
      };
};

const IDLE_MS = 2_800;

type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

async function enterNativeFullscreen(el: HTMLElement): Promise<boolean> {
  const node = el as FsEl;
  try {
    if (node.requestFullscreen) {
      await node.requestFullscreen();
      return true;
    }
    if (node.webkitRequestFullscreen) {
      await node.webkitRequestFullscreen();
      return true;
    }
    if (node.msRequestFullscreen) {
      await node.msRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function exitNativeFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  if (getFullscreenElement() == null) return;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return;
    }
    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return;
    }
    if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch {
    /* ignore */
  }
}

function wrap(i: number, total: number) {
  return ((i % total) + total) % total;
}

/**
 * Photobook: left page stays put. Only the right leaf turns across the spine.
 */
export function StorySlideshow({
  storyName: _storyName,
  images,
  destHero,
  backTo,
}: StorySlideshowProps) {
  const isMobile = useIsMobile();
  const { album, destGallery } = useMenuConfig();
  const total = images.length;
  const turnMs = Math.round(album.turnSec * 1000);
  const holdMs = Math.round(album.autoSec * 1000);

  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [flip, setFlip] = useState<"idle" | "next" | "prev">("idle");
  const [leafOn, setLeafOn] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [nativeFs, setNativeFs] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const timerRef = useRef<number | null>(null);
  const idleRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const isFullscreen = nativeFs || immersive;

  useEffect(() => {
    setRevealed(false);
    const id = window.setTimeout(
      () => setRevealed(true),
      Math.round(destGallery.delaySec * 1000),
    );
    return () => window.clearTimeout(id);
  }, [destGallery.delaySec, destHero]);

  const clearAuto = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
    if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => {
      setChromeVisible(false);
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    bumpChrome();
    const onMove = () => bumpChrome();
    const onTouch = () => bumpChrome();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onTouch);
      if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    };
  }, [bumpChrome]);

  useEffect(() => {
    const syncFs = () => {
      const el = rootRef.current;
      const active = Boolean(el && getFullscreenElement() === el);
      setNativeFs(active);
      if (active) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", syncFs);
    document.addEventListener("webkitfullscreenchange", syncFs as EventListener);
    document.addEventListener("MSFullscreenChange", syncFs as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", syncFs);
      document.removeEventListener(
        "webkitfullscreenchange",
        syncFs as EventListener,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        syncFs as EventListener,
      );
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    bumpChrome();
    const el = rootRef.current;
    if (!el) return;
    if (getFullscreenElement() === el) {
      await exitNativeFullscreen();
      setNativeFs(false);
      setImmersive(false);
      return;
    }
    if (immersive) {
      setImmersive(false);
      return;
    }
    const ok = await enterNativeFullscreen(el);
    if (ok) {
      setNativeFs(true);
      setImmersive(false);
      return;
    }
    setImmersive(true);
    setNativeFs(false);
  }, [bumpChrome, immersive]);

  const turn = useCallback(
    (dir: "next" | "prev") => {
      if (total < 2 || busyRef.current) return;
      busyRef.current = true;
      bumpChrome();
      setFlip(dir);
      setLeafOn(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setLeafOn(true));
      });
      window.setTimeout(() => {
        setIndex((i) => wrap(dir === "next" ? i + 1 : i - 1, total));
        setFlip("idle");
        setLeafOn(false);
        busyRef.current = false;
      }, turnMs);
    },
    [total, bumpChrome, turnMs],
  );

  const goNext = useCallback(() => turn("next"), [turn]);
  const goPrev = useCallback(() => turn("prev"), [turn]);

  const toggleAuto = useCallback(() => {
    setAutoPlay((v) => !v);
    bumpChrome();
  }, [bumpChrome]);

  useEffect(() => {
    clearAuto();
    const current = images[index];
    if (current && isPlayableVideoSrc(current)) return;
    if (!autoPlay || total < 2 || flip !== "idle" || isMobile) return;
    timerRef.current = window.setTimeout(() => turn("next"), holdMs);
    return clearAuto;
  }, [index, total, turn, clearAuto, autoPlay, holdMs, flip, isMobile, images]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggleAuto();
      }
      if (e.key === "Escape") {
        if (getFullscreenElement() === rootRef.current) {
          void exitNativeFullscreen();
        }
        setImmersive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, toggleAuto]);

  useEffect(() => {
    if (total === 0) return;
    for (const i of [index, index + 1, index + 2, index - 1]) {
      const src = images[wrap(i, total)];
      if (!src || isPlayableVideoSrc(src)) continue;
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.src = src;
    }
  }, [images, index, total]);

  useEffect(() => {
    if (!immersive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [immersive]);

  useEffect(() => {
    return () => {
      setImmersive(false);
      if (getFullscreenElement() === rootRef.current) {
        void exitNativeFullscreen();
      }
    };
  }, []);

  if (total === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-fg-muted">
        No images
      </div>
    );
  }

  const frameClass = galleryFrameClass(destGallery.frameStyle);

  if (isMobile) {
    return (
      <div className="relative min-h-dvh bg-black">
        <div
          className="relative z-10"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 1.05s ease, transform 1.05s ease",
          }}
        >
          <StoryMobileGallery
            images={images}
            backTo={backTo}
          />
        </div>
      </div>
    );
  }

  const leftSrc = images[index]!;
  const rightSrc = images[wrap(index + 1, total)]!;
  const nextRightSrc = images[wrap(index + 2, total)]!;
  const prevLeftSrc = images[wrap(index - 1, total)]!;

  const chromeOpacity = chromeVisible ? 1 : 0.12;
  const edgeOpacity = chromeVisible ? 0.65 : 0.22;
  const sideBtnClass =
    "absolute top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-[2px] transition-opacity duration-300 sm:size-9";

  return (
    <>
    <div
      ref={rootRef}
      className={
        immersive
          ? "fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-black"
          : "relative z-10 h-dvh w-full overflow-hidden bg-black"
      }
      onMouseMove={bumpChrome}
      style={{
        opacity: revealed ? 1 : 0,
        transition: "opacity 1.05s ease",
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center px-3 py-12 sm:px-8"
        style={{ perspective: "2200px" }}
      >
        <PhotoBook
          leftSrc={flip === "prev" ? prevLeftSrc : leftSrc}
          rightSrc={flip === "next" ? nextRightSrc : rightSrc}
          leafSrc={flip === "next" ? rightSrc : flip === "prev" ? leftSrc : null}
          flip={flip}
          leafOn={leafOn}
          turnMs={turnMs}
        />
      </div>

      <Link
        to={backTo.to}
        params={"params" in backTo ? backTo.params : undefined}
        onClick={bumpChrome}
        className="absolute top-[max(1rem,var(--grok-banner-h,0.5rem))] left-3 z-30 inline-flex min-h-9 min-w-9 items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-white/85 hover:bg-black/55 hover:text-white sm:left-4 sm:top-[max(1.25rem,var(--grok-banner-h,0.75rem))]"
        style={{ opacity: chromeOpacity }}
      >
        <span aria-hidden="true">←</span>
        Back
      </Link>

      <button
        type="button"
        aria-label="Previous"
        onClick={goPrev}
        className={`${sideBtnClass} left-3 sm:left-4`}
        style={{ opacity: edgeOpacity }}
      >
        <ChevronLeft className="size-4 sm:size-[1.1rem]" strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={goNext}
        className={`${sideBtnClass} right-3 sm:right-4`}
        style={{ opacity: edgeOpacity }}
      >
        <ChevronRight className="size-4 sm:size-[1.1rem]" strokeWidth={2} aria-hidden="true" />
      </button>

      <div
        className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(0.85rem,env(safe-area-inset-bottom))] transition-opacity duration-500 sm:pb-5"
        style={{ opacity: chromeOpacity }}
      >
        <div className="flex w-[min(90vw,22rem)] items-center gap-2 rounded-2xl bg-black/50 px-2.5 py-1.5 backdrop-blur-[4px] sm:w-[min(72vw,24rem)] sm:px-3 sm:py-2">
          <button
            type="button"
            aria-label={autoPlay ? "Pause" : "Play"}
            onClick={toggleAuto}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/12 text-white/90"
          >
            {autoPlay ? (
              <Pause className="size-3" strokeWidth={2} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play className="size-3 translate-x-px" strokeWidth={2} fill="currentColor" aria-hidden="true" />
            )}
          </button>
          <div className="relative h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/70"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-[0.58rem] tabular-nums tracking-wide text-white/70">
            {index + 1}–{wrap(index + 1, total) + 1}/{total}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggleFullscreen();
        }}
        className="absolute bottom-[max(1.1rem,env(safe-area-inset-bottom))] right-4 z-40 flex size-9 items-center justify-center rounded-md border border-white/20 bg-black/55 text-white sm:bottom-5 sm:right-5 sm:size-10"
        style={{ opacity: chromeVisible ? 0.7 : 0.25 }}
      >
        {isFullscreen ? (
          <Minimize2 className="size-4" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Maximize2 className="size-4" strokeWidth={2} aria-hidden="true" />
        )}
      </button>
    </div>
    </>
  );
}

function StoryMobileGallery({
  images,
  backTo,
}: {
  images: readonly string[];
  backTo: StorySlideshowProps["backTo"];
}) {
  return (
    <div className="min-h-dvh overflow-y-auto bg-black text-fg">
      <Link
        to={backTo.to}
        params={"params" in backTo ? backTo.params : undefined}
        className="fixed top-[max(1rem,var(--grok-banner-h,0.5rem))] left-3 z-30 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-black/45 px-3 text-[0.78rem] font-medium tracking-wide text-white/90"
      >
        <span aria-hidden="true">←</span>
        Back
      </Link>
      <div className="flex flex-col">
        {images.map((src, i) => (
          <figure
            key={`${src}-${i}`}
            className="flex h-[100dvh] w-full items-center justify-center bg-black"
          >
            {isPlayableVideoSrc(src) ? (
              <video
                src={src}
                controls
                playsInline
                preload={i < 2 ? "metadata" : "none"}
                className="max-h-[100dvh] max-w-full h-auto w-auto object-contain object-center"
              />
            ) : (
              <img
                src={src}
                alt=""
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                referrerPolicy="no-referrer"
                className="max-h-[100dvh] max-w-full h-auto w-auto object-contain object-center"
              />
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

function PhotoBook({
  leftSrc,
  rightSrc,
  leafSrc,
  flip,
  leafOn,
  turnMs,
}: {
  leftSrc: string;
  rightSrc: string;
  leafSrc: string | null;
  flip: "idle" | "next" | "prev";
  leafOn: boolean;
  turnMs: number;
}) {
  return (
    <div
      className="relative flex overflow-hidden"
      style={{
        height: "min(90vh, 880px, calc((100vw - 4rem) / 1.48))",
        width: "min(92vw, 1320px, calc(90vh * 1.48))",
        maxWidth: 1320,
        transformStyle: "preserve-3d",
        background: "linear-gradient(180deg, #17150f 0%, #0e0d0b 100%)",
        boxShadow:
          "0 0 0 2px rgba(214, 186, 128, 0.4), 0 1px 0 rgba(245, 236, 214, 0.16), 0 22px 48px rgba(0, 0, 0, 0.48)",
      }}
    >
      <BookPage src={leftSrc} side="left" />
      <div
        className="relative z-[3] w-[3px] shrink-0 self-stretch"
        style={{
          background:
            "linear-gradient(180deg, rgba(214,186,128,0.08), rgba(214,186,128,0.42) 18%, rgba(20,16,10,0.92) 50%, rgba(214,186,128,0.34) 82%, rgba(214,186,128,0.08))",
          boxShadow:
            "-10px 0 18px rgba(0,0,0,0.28), 10px 0 18px rgba(0,0,0,0.28)",
        }}
        aria-hidden="true"
      />
      <BookPage src={rightSrc} side="right" />

      {leafSrc && flip !== "idle" ? (
        <div
          className="absolute top-0 z-[4] h-full"
          style={{
            width: "50%",
            left: flip === "next" ? "50%" : 0,
            transformOrigin: flip === "next" ? "left center" : "right center",
            transformStyle: "preserve-3d",
            transform: leafOn
              ? flip === "next"
                ? "rotateY(-180deg)"
                : "rotateY(180deg)"
              : "rotateY(0deg)",
            transition: `transform ${turnMs}ms cubic-bezier(0.45, 0.05, 0.22, 1)`,
          }}
        >
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              boxShadow:
                flip === "next"
                  ? "8px 14px 30px rgba(0,0,0,0.32)"
                  : "-8px 14px 30px rgba(0,0,0,0.32)",
            }}
          >
            <FramedPhoto src={leafSrc} side={flip === "next" ? "right" : "left"} />
          </div>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <FramedPhoto src={leafSrc} side={flip === "next" ? "left" : "right"} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BookPage({ src, side }: { src: string; side: "left" | "right" }) {
  return (
    <div className="relative h-full w-1/2 overflow-hidden">
      <FramedPhoto src={src} side={side} />
    </div>
  );
}

function FramedPhoto({
  src,
  side,
}: {
  src: string;
  side: "left" | "right";
}) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(180deg, #1b1914 0%, #12100c 100%)",
        boxShadow:
          side === "left"
            ? "inset 0 0 0 2px rgba(214, 186, 128, 0.48), inset -22px 0 28px rgba(0,0,0,0.22)"
            : "inset 0 0 0 2px rgba(214, 186, 128, 0.48), inset 22px 0 28px rgba(0,0,0,0.22)",
      }}
    >
      <div
        className="absolute inset-[9px] overflow-hidden sm:inset-[12px]"
        style={{
          boxShadow:
            "inset 0 0 0 1.5px rgba(245, 238, 220, 0.32), 0 8px 18px rgba(0,0,0,0.22)",
        }}
      >
        {isPlayableVideoSrc(src) ? (
          <video
            src={src}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain object-center"
          />
        ) : (
          <img
            src={src}
            alt=""
            draggable={false}
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain object-center"
          />
        )}
      </div>
    </div>
  );
}
