"use client";

import { createFileRoute } from "@tanstack/react-router";
import { ModelDestinationsView } from "@/components/model-destinations-view";

export const Route = createFileRoute("/experience/$destination/")({
  component: ModelDestinationsPage,
  head: () => ({
    meta: [{ title: "Destinations — Moon's AI Travel" }],
  }),
});

function ModelDestinationsPage() {
  const { destination } = Route.useParams();
  return <ModelDestinationsView modelId={destination} />;
}
