"use client";

import { createFileRoute } from "@tanstack/react-router";
import { TravelExperienceView } from "@/components/travel-experience-view";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Moon's AI Travel" },
      {
        name: "description",
        content: "Choose where you want to go.",
      },
    ],
  }),
});

function Home() {
  return <TravelExperienceView />;
}
