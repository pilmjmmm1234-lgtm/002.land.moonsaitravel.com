"use client";

import { createFileRoute } from "@tanstack/react-router";
import { DestImageGallery } from "@/components/dest-image-gallery";

export const Route = createFileRoute("/experience/$destination/$story")({
  component: DestGalleryPage,
  head: () => ({
    meta: [{ title: "Gallery — Moon's AI Travel" }],
  }),
});

function DestGalleryPage() {
  const { destination, story } = Route.useParams();
  return <DestImageGallery modelId={destination} placeId={story} />;
}
