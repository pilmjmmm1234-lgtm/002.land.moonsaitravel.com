"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MAIN_SCREEN_REFRESH_MS } from "@/content/01_Main_Screen/images";
import { createNaturalShufflePlayer } from "@/lib/natural-shuffle";
import {
  fetchMainScreenItemsCached,
  preloadImage,
} from "@/lib/main-screen-cache";
import { IMAGE_QUALITY, IMAGE_WIDTH, withImageWidth } from "@/lib/image-proxy";
import { useMenuConfig } from "@/lib/menu-config";

const START_SCALE = 0.84;
const FRAME_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Phase = "zoom" | "hold" | "exit";
type ExitFx = "frame" | "fade" | "drift" | "drop" | "overlap";

const EXIT_CYCLE: ExitFx[] = ["frame", "fade", "drift", "drop", "overlap"];

function wait(ms: number, signal: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    const id = window.setTimeout(resolve, ms);
    if (signal.cancelled) {
      window.clearTimeout(id);
      resolve();
    }
  });
}

function exitStyle(fx: ExitFx): CSSProperties {
  switch (fx) {
    case "frame":
      return { opacity: 0, transform: "scale(0.4)" };
    case "fade":
      return { opacity: 0, transform: "scale(1)" };
    case "drift":
      return { opacity: 0, transform: "translateX(5.5%) scale(0.62)" };
    case "drop":
      return { opacity: 0, transform: "translateY(11%) scale(0.56)" };
    case "overlap":
      return { opacity: 0, transform: "scale(1.02)" };
  }
}

/**
 * Digital travel frame: full photo visible (contain), slow zoom toward the viewer,
 * brief hold, then a cycling exit. No crop, no color grading.
 */
export function MainScreenSlideshow() {
  const { frameTiming } = useMenuConfig();
  const zoomMs = Math.round(frameTiming.zoomSec * 1000);
  const holdMs = Math.round(frameTiming.holdSec * 1000);
  const exitMs = Math.round(frameTiming.exitSec * 1000);
  const playerRef = useRef<ReturnType<
    typeof createNaturalShufflePlayer<string>
  > | null>(null);
  const etagRef = useRef("");
  const fxRef = useRef(0);

  const [srcA, setSrcA] = useState("");
  const [srcB, setSrcB] = useState("");
  const [showA, setShowA] = useState(true);
  const [phase, setPhase] = useState<Phase>("zoom");
  const [fx, setFx] = useState<ExitFx>("frame");
  const [ready, setReady] = useState(false);
  const [zoomKey, setZoomKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const items = await fetchMainScreenItemsCached();
        if (items.length === 0 || cancelled) return;

        const fingerprint = items.map((i) => `${i.id}:${i.src}`).join("|");
        if (fingerprint === etagRef.current && ready) return;
        etagRef.current = fingerprint;

        const srcs = items.map((i) =>
          withImageWidth(i.src, IMAGE_WIDTH.hero, IMAGE_QUALITY.hero),
        );
        playerRef.current = createNaturalShufflePlayer(srcs);

        if (!ready) {
          const first = playerRef.current.next();
          await preloadImage(first);
          if (cancelled) return;
          const nextOne = srcs.find((s) => s !== first);
          if (nextOne) void preloadImage(nextOne);
          setSrcA(first);
          setSrcB("");
          setShowA(true);
          setPhase("zoom");
          setReady(true);
        }
      } catch {
        /* keep */
      }
    };

    void load();
    const id = window.setInterval(() => void load(), MAIN_SCREEN_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const signal = { cancelled: false };

    const run = async () => {
      while (!signal.cancelled && playerRef.current) {
        setPhase("zoom");
        await wait(reduceMotion ? 80 : zoomMs, signal);
        if (signal.cancelled) return;

        setPhase("hold");
        await wait(reduceMotion ? 1600 : holdMs, signal);
        if (signal.cancelled) return;

        const nextSrc = playerRef.current.next();
        await preloadImage(nextSrc);
        if (signal.cancelled) return;

        setShowA((frontIsA) => {
          if (frontIsA) setSrcB(nextSrc);
          else setSrcA(nextSrc);
          return frontIsA;
        });

        const nextFx = EXIT_CYCLE[fxRef.current % EXIT_CYCLE.length];
        setFx(nextFx);
        fxRef.current += 1;

        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (signal.cancelled) return;
        setPhase("exit");
        await wait(reduceMotion ? 400 : exitMs, signal);
        if (signal.cancelled) return;

        setShowA((v) => !v);
        setPhase("zoom");
        setZoomKey((k) => k + 1);
      }
    };

    void run();
    return () => {
      signal.cancelled = true;
    };
  }, [ready, zoomMs, holdMs, exitMs]);

  return (
    <div
      className="overflow-hidden bg-black max-[768px]:relative max-[768px]:aspect-3/4 max-[768px]:h-auto max-[768px]:w-full min-[769px]:absolute min-[769px]:inset-0 min-[769px]:h-[100dvh] min-[769px]:w-screen"
      aria-hidden="true"
    >
      {!ready ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
          <p className="text-sm font-medium tracking-[0.18em] text-fg/70">
            Moon's AI Travel
          </p>
          <div
            className="h-7 w-7 animate-spin rounded-full border border-fg/15 border-t-fg/45"
            aria-hidden="true"
          />
          <p className="text-[0.7rem] tracking-wide text-fg-muted">
            Preparing your journey…
          </p>
        </div>
      ) : null}

      <FrameLayer
        src={srcA}
        isFront={showA}
        phase={phase}
        fx={fx}
        zoomKey={zoomKey}
        zoomMs={zoomMs}
        exitMs={exitMs}
      />
      <FrameLayer
        src={srcB}
        isFront={!showA}
        phase={phase}
        fx={fx}
        zoomKey={zoomKey}
        zoomMs={zoomMs}
        exitMs={exitMs}
      />
    </div>
  );
}

function FrameLayer({
  src,
  isFront,
  phase,
  fx,
  zoomKey,
  zoomMs,
  exitMs,
}: {
  src: string;
  isFront: boolean;
  phase: Phase;
  fx: ExitFx;
  zoomKey: number;
  zoomMs: number;
  exitMs: number;
}) {
  if (!src) return null;

  const incomingOverlap = !isFront && phase === "exit" && fx === "overlap";
  const incomingOther = !isFront && phase === "exit";

  let style: CSSProperties;

  if (isFront && phase === "zoom") {
    style = {
      opacity: 1,
      animation: `main-frame-zoom ${zoomMs}ms ${FRAME_EASE} forwards`,
      zIndex: 2,
    };
  } else if (isFront && phase === "hold") {
    style = {
      opacity: 1,
      transform: "scale(1)",
      zIndex: 2,
    };
  } else if (isFront && phase === "exit") {
    style = {
      ...exitStyle(fx),
      transition: `opacity ${exitMs}ms ${FRAME_EASE}, transform ${exitMs}ms ${FRAME_EASE}`,
      zIndex: 2,
    };
  } else if (incomingOverlap) {
    style = {
      opacity: 1,
      transform: `scale(${START_SCALE})`,
      transition: `opacity ${exitMs}ms ${FRAME_EASE}, transform ${exitMs}ms ${FRAME_EASE}`,
      zIndex: 1,
    };
  } else if (incomingOther) {
    style = {
      opacity: 1,
      transform: `scale(${START_SCALE})`,
      transition: `opacity ${Math.round(exitMs * 0.85)}ms ${FRAME_EASE}`,
      zIndex: 1,
    };
  } else {
    style = {
      opacity: 0,
      transform: `scale(${START_SCALE})`,
      zIndex: 1,
    };
  }

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: style.zIndex }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          key={isFront ? `front-${zoomKey}` : `back-${src}`}
          src={src}
          alt=""
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full select-none object-contain object-center"
          style={{
            opacity: style.opacity,
            transform: style.transform,
            transition: style.transition,
            animation: style.animation,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
}
