import { createFileRoute } from "@tanstack/react-router";
import {
  inspectTravelContent,
  listTravelGallery,
  listTravelModels,
  listTravelPlaces,
} from "@/lib/travel-experience.server";

export const Route = createFileRoute("/api/travel-experience/destinations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const scope = (url.searchParams.get("scope") || "models").trim();
          const folder =
            url.searchParams.get("folder") ||
            url.searchParams.get("root") ||
            "";
          const cover = url.searchParams.get("cover") || "cover.jpg";
          const modelId = url.searchParams.get("model") || "";
          const placeId = url.searchParams.get("place") || "";

          if (scope === "debug") {
            const info = await inspectTravelContent(folder, cover);
            return Response.json(
              { source: "drive-shallow", scope, ...info },
              { headers: { "Cache-Control": "no-store" } },
            );
          }

          if (scope === "places") {
            const data = await listTravelPlaces(modelId, cover);
            return Response.json(
              {
                source: "drive-shallow",
                scope,
                count: data.places.length,
                publicPlaces: data.publicPlaces,
                privatePlaces: data.privatePlaces,
                places: data.places,
              },
              { headers: { "Cache-Control": "private, max-age=120" } },
            );
          }

          if (scope === "gallery") {
            const { images } = await listTravelGallery(placeId);
            return Response.json(
              { source: "drive-shallow", scope, count: images.length, images },
              { headers: { "Cache-Control": "private, max-age=120" } },
            );
          }

          const destinations = await listTravelModels(folder, cover);
          return Response.json(
            {
              source: "drive-shallow",
              scope: "models",
              count: destinations.length,
              folder: folder || null,
              destinations,
            },
            { headers: { "Cache-Control": "private, max-age=120" } },
          );
        } catch {
          return Response.json(
            {
              source: "drive-shallow",
              count: 0,
              destinations: [],
              places: [],
              publicPlaces: [],
              privatePlaces: [],
              images: [],
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
