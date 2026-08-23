/**
 * Travel Experience destinations — pre-made card images only.
 * No runtime image generation.
 */
export type Destination = {
  slug: string;
  name: string;
  image: string;
};

export const DESTINATIONS: readonly Destination[] = [
  { slug: "bali", name: "Bali", image: "/destinations/bali.jpg" },
  { slug: "kyoto", name: "Kyoto", image: "/destinations/kyoto.jpg" },
  { slug: "paris", name: "Paris", image: "/destinations/paris.jpg" },
  {
    slug: "switzerland",
    name: "Switzerland",
    image: "/destinations/switzerland.jpg",
  },
  { slug: "maldives", name: "Maldives", image: "/destinations/maldives.jpg" },
  { slug: "new-york", name: "New York", image: "/destinations/new-york.jpg" },
] as const;

export function getDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}

/** Local card image when Drive cover is missing or fails. */
export function localDestImage(id: string, name = ""): string | null {
  const blob = `${id} ${name}`.trim().toLowerCase();
  if (!blob) return null;
  if (blob.includes("korea") || blob.includes("koera")) {
    return "/images/hero-travel.jpg";
  }
  if (blob.includes("egypt") || blob.includes("eglpt")) {
    return "/images/hero-travel.jpg";
  }
  const found = DESTINATIONS.find(
    (d) =>
      blob.includes(d.slug) ||
      blob.includes(d.name.toLowerCase()) ||
      d.slug.replace("-", "") === blob.replace(/[\s_-]/g, ""),
  );
  return found?.image ?? null;
}
