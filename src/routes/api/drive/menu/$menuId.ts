import { createFileRoute } from "@tanstack/react-router";
import { isPage4MenuId } from "@/content/04_Page/menus";
import { listMenuMedia } from "@/lib/drive/client.server";

export const Route = createFileRoute("/api/drive/menu/$menuId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const menuId = params.menuId;
        if (!isPage4MenuId(menuId)) {
          return Response.json(
            { menuId, source: "local-mirror", items: [] },
            { status: 200 },
          );
        }
        try {
          const listing = await listMenuMedia(menuId);
          return Response.json(
            {
              menuId: listing.menuId,
              source: listing.source,
              items: listing.items ?? [],
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json(
            { menuId, source: "local-mirror", items: [] },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
