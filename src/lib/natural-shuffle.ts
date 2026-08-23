/**
 * Natural Shuffle for slideshow playlists.
 * - Random first image
 * - Random order each cycle
 * - Each image once per cycle
 * - No consecutive same image
 * - No immediate repeat of the last played when reshuffling
 * - Fresh order every page visit (caller creates a new player)
 */

function fisherYates<T>(items: readonly T[]): T[] {
  const deck = items.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = a;
  }
  return deck;
}

/**
 * Build one full cycle of unique images, avoiding `avoid` as the first item
 * when other choices exist.
 */
export function buildNaturalCycle<T>(
  items: readonly T[],
  avoid: T | null = null,
): T[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [items[0]!];

  let deck = fisherYates(items);

  if (avoid !== null && deck[0] === avoid) {
    const swapAt = deck.findIndex((item, i) => i > 0 && item !== avoid);
    if (swapAt > 0) {
      const first = deck[0]!;
      deck[0] = deck[swapAt]!;
      deck[swapAt] = first;
    }
  }

  return deck;
}

export type NaturalShufflePlayer<T> = {
  /** Advance and return the next item (reshuffles when the cycle ends). */
  next: () => T;
  /** Current item without advancing. */
  current: () => T | null;
  /** Peek remaining count in the current cycle. */
  remainingInCycle: () => number;
};

/**
 * Continuous player: exhaust a natural cycle, then reshuffle with
 * no immediate repeat of the last played image.
 */
export function createNaturalShufflePlayer<T>(
  items: readonly T[],
): NaturalShufflePlayer<T> {
  if (items.length === 0) {
    return {
      next: () => {
        throw new Error("Natural shuffle: empty playlist");
      },
      current: () => null,
      remainingInCycle: () => 0,
    };
  }

  let last: T | null = null;
  let queue = buildNaturalCycle(items, null);
  let index = 0;

  return {
    next() {
      if (index >= queue.length) {
        queue = buildNaturalCycle(items, last);
        index = 0;
      }
      const item = queue[index]!;
      index += 1;
      last = item;
      return item;
    },
    current() {
      if (index === 0) return last;
      return queue[index - 1] ?? last;
    },
    remainingInCycle() {
      return Math.max(0, queue.length - index);
    },
  };
}
