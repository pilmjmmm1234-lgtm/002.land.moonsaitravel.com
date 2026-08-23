/**
 * ~10 photography-friendly transition effects.
 * Used by main screen + Travel Story slideshows.
 */

import type { CSSProperties } from "react";

export type TransitionId =
  | "crossfade"
  | "soft_dark"
  | "zoom_in"
  | "zoom_out"
  | "slide_left"
  | "slide_right"
  | "slide_up"
  | "blur_dissolve"
  | "drift"
  | "lift";

export const TRANSITION_IDS: readonly TransitionId[] = [
  "crossfade",
  "soft_dark",
  "zoom_in",
  "zoom_out",
  "slide_left",
  "slide_right",
  "slide_up",
  "blur_dissolve",
  "drift",
  "lift",
] as const;

export const TRANSITION_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export type LayerVisual = {
  opacity: number;
  transform: string;
  filter: string;
};

export function incomingVisual(
  id: TransitionId,
  phase: "from" | "to",
): LayerVisual {
  const shown = phase === "to";
  switch (id) {
    case "crossfade":
      return {
        opacity: shown ? 1 : 0,
        transform: "none",
        filter: "none",
      };
    case "soft_dark":
      return {
        opacity: shown ? 1 : 0,
        transform: "scale(1.02)",
        filter: shown ? "brightness(1)" : "brightness(0.55)",
      };
    case "zoom_in":
      return {
        opacity: shown ? 1 : 0,
        transform: shown ? "scale(1)" : "scale(1.08)",
        filter: "none",
      };
    case "zoom_out":
      return {
        opacity: shown ? 1 : 0,
        transform: shown ? "scale(1)" : "scale(0.94)",
        filter: "none",
      };
    case "slide_left":
      return {
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : "translate3d(4%,0,0)",
        filter: "none",
      };
    case "slide_right":
      return {
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : "translate3d(-4%,0,0)",
        filter: "none",
      };
    case "slide_up":
      return {
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : "translate3d(0,3.5%,0)",
        filter: "none",
      };
    case "blur_dissolve":
      return {
        opacity: shown ? 1 : 0,
        transform: "none",
        filter: shown ? "blur(0px)" : "blur(10px)",
      };
    case "drift":
      return {
        opacity: shown ? 1 : 0,
        transform: shown
          ? "translate3d(0,0,0) scale(1)"
          : "translate3d(-2.5%,1.5%,0) scale(1.04)",
        filter: "none",
      };
    case "lift":
      return {
        opacity: shown ? 1 : 0,
        transform: shown ? "scale(1)" : "scale(1.06) translate3d(0,2%,0)",
        filter: shown ? "brightness(1)" : "brightness(0.85)",
      };
    default:
      return { opacity: shown ? 1 : 0, transform: "none", filter: "none" };
  }
}

export function outgoingVisual(
  id: TransitionId,
  phase: "from" | "to",
): LayerVisual {
  const gone = phase === "to";
  switch (id) {
    case "crossfade":
      return {
        opacity: gone ? 0 : 1,
        transform: "none",
        filter: "none",
      };
    case "soft_dark":
      return {
        opacity: gone ? 0 : 1,
        transform: "scale(1)",
        filter: gone ? "brightness(0.4)" : "brightness(1)",
      };
    case "zoom_in":
      return {
        opacity: gone ? 0 : 1,
        transform: gone ? "scale(1.06)" : "scale(1)",
        filter: "none",
      };
    case "zoom_out":
      return {
        opacity: gone ? 0 : 1,
        transform: gone ? "scale(0.96)" : "scale(1)",
        filter: "none",
      };
    case "slide_left":
      return {
        opacity: gone ? 0 : 1,
        transform: gone ? "translate3d(-4%,0,0)" : "translate3d(0,0,0)",
        filter: "none",
      };
    case "slide_right":
      return {
        opacity: gone ? 0 : 1,
        transform: gone ? "translate3d(4%,0,0)" : "translate3d(0,0,0)",
        filter: "none",
      };
    case "slide_up":
      return {
        opacity: gone ? 0 : 1,
        transform: gone ? "translate3d(0,-3%,0)" : "translate3d(0,0,0)",
        filter: "none",
      };
    case "blur_dissolve":
      return {
        opacity: gone ? 0 : 1,
        transform: "none",
        filter: gone ? "blur(12px)" : "blur(0px)",
      };
    case "drift":
      return {
        opacity: gone ? 0 : 1,
        transform: gone
          ? "translate3d(2.5%,-1%,0) scale(1.03)"
          : "translate3d(0,0,0) scale(1)",
        filter: "none",
      };
    case "lift":
      return {
        opacity: gone ? 0 : 1,
        transform: gone ? "scale(0.97) translate3d(0,-1.5%,0)" : "scale(1)",
        filter: gone ? "brightness(0.9)" : "brightness(1)",
      };
    default:
      return { opacity: gone ? 0 : 1, transform: "none", filter: "none" };
  }
}

export function pickTransition(exclude?: TransitionId | null): TransitionId {
  const pool =
    exclude && TRANSITION_IDS.length > 1
      ? TRANSITION_IDS.filter((id) => id !== exclude)
      : TRANSITION_IDS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function visualStyle(
  v: LayerVisual,
  durationMs: number,
  animate: boolean,
): CSSProperties {
  return {
    opacity: v.opacity,
    transform: v.transform,
    filter: v.filter === "none" ? undefined : v.filter,
    transition: animate
      ? `opacity ${durationMs}ms ${TRANSITION_EASE}, transform ${durationMs}ms ${TRANSITION_EASE}, filter ${durationMs}ms ${TRANSITION_EASE}`
      : "none",
    willChange: "opacity, transform, filter",
  };
}
