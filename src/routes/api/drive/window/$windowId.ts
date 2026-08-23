import { createFileRoute } from "@tanstack/react-router";
import { isPage4WindowId } from "@/content/04_Page/windows";
import { listWindowMedia } from "@/lib/drive/client.server";

export const Route = createFileRoute("/api/drive/window/$windowId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const windowId = params.windowId;
        if (!isPage4WindowId(windowId)) {
          return Response.json(
            { windowId, source: "local-mirror", items: [] },
            { status: 200 },
          );
        }
        try {
          const listing = await listWindowMedia(windowId);
          return Response.json(
            {
              windowId: listing.windowId,
              source: listing.source,
              items: listing.items ?? [],
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json(
            { windowId, source: "local-mirror", items: [] },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
