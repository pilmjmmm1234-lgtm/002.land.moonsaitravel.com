import { createFileRoute } from "@tanstack/react-router";
import { TRAVEL_LIFESTYLE_APPS_SCRIPT_URL } from "@/content/Travel_Lifestyle/video";

type ScriptVideo = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string;
};

type ScriptResponse = {
  success?: boolean;
  travelLifestyle?: {
    folder?: string;
    count?: number;
    videos?: ScriptVideo[];
  };
  // also accept flat shape if script returns videos at root
  videos?: ScriptVideo[];
};

/**
 * List 02_Travel_Lifestyle videos from Apps Script.
 * Returns proxied /api/travel-lifestyle/stream?src=… URLs for browser playback.
 */
export const Route = createFileRoute("/api/travel-lifestyle/videos")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(TRAVEL_LIFESTYLE_APPS_SCRIPT_URL, {
            redirect: "follow",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            return Response.json(
              { source: "apps-script", folder: "02_Travel_Lifestyle", items: [] },
              { headers: { "Cache-Control": "no-store" } },
            );
          }

          const data = (await res.json()) as ScriptResponse;
          const raw =
            data.travelLifestyle?.videos ?? data.videos ?? [];

          const items = raw
            .filter((v) => Boolean(v?.url?.trim()))
            .map((v) => {
              const rawUrl = v.url!.trim();
              return {
                id: v.id || rawUrl,
                name: v.name?.trim() || v.id || "video",
                kind: "video" as const,
                src: `/api/travel-lifestyle/stream?src=${encodeURIComponent(rawUrl)}`,
                mimeType: v.mimeType || "video/mp4",
              };
            });

          return Response.json(
            {
              source: "apps-script",
              folder:
                data.travelLifestyle?.folder || "02_Travel_Lifestyle",
              count: items.length,
              items,
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json(
            {
              source: "apps-script",
              folder: "02_Travel_Lifestyle",
              count: 0,
              items: [],
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
