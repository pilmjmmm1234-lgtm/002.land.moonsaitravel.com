/**
 * Destination virtual experience galleries — pre-made images only.
 * Homepage never generates or edits images at runtime.
 */
export const EXPERIENCE_GALLERIES: Record<string, readonly string[]> = {
  bali: [
    "/experiences/bali/01.jpg",
    "/experiences/bali/02.jpg",
    "/experiences/bali/03.jpg",
  ],
  kyoto: [
    "/experiences/kyoto/01.jpg",
    "/experiences/kyoto/02.jpg",
    "/experiences/kyoto/03.jpg",
  ],
  paris: [
    "/experiences/paris/01.jpg",
    "/experiences/paris/02.jpg",
    "/experiences/paris/03.jpg",
  ],
  switzerland: [
    "/experiences/switzerland/01.jpg",
    "/experiences/switzerland/02.jpg",
    "/experiences/switzerland/03.jpg",
  ],
  maldives: [
    "/experiences/maldives/01.jpg",
    "/experiences/maldives/02.jpg",
    "/experiences/maldives/03.jpg",
  ],
  "new-york": [
    "/experiences/new-york/01.jpg",
    "/experiences/new-york/02.jpg",
    "/experiences/new-york/03.jpg",
  ],
};

export function getExperienceImages(slug: string): readonly string[] {
  return EXPERIENCE_GALLERIES[slug] ?? [];
}
