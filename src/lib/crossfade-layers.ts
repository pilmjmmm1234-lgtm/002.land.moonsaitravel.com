/**
 * Dual-buffer crossfade helpers.
 * Natural: outgoing fades out while incoming fades in (overlap, no black gap).
 */

/** Gentle ease — slow start/end, good for photography. */
export const CROSSFADE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export type DualLayer = {
  /** Index in source list (or -1 empty) */
  a: number;
  b: number;
  /** true = layer A is the visible front */
  showA: boolean;
};

export function createDualLayer(startIndex: number): DualLayer {
  return { a: startIndex, b: startIndex, showA: true };
}

/**
 * Begin crossfade to target index.
 * Puts target on the hidden layer, then caller flips showA after paint.
 */
export function prepareDualLayer(d: DualLayer, target: number): DualLayer {
  if (d.showA) {
    return { a: d.a, b: target, showA: true };
  }
  return { a: target, b: d.b, showA: false };
}

/** After hidden layer is ready, flip which layer is on top. */
export function flipDualLayer(d: DualLayer): DualLayer {
  return { ...d, showA: !d.showA };
}

export function dualVisibleIndex(d: DualLayer): number {
  return d.showA ? d.a : d.b;
}
