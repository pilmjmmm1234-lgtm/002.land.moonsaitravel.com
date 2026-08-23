import { createFileRoute } from "@tanstack/react-router";
import { listMainScreenImages } from "@/lib/drive/client.server";

export const Route = createFileRoute("/api/drive/main-screen")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const listing = await listMainScreenImages();
          return Response.json(
            {
              folderId: listing.folderId || "01_Main_Screen",
              source: listing.source,
              driveEnabled: false,
              items: listing.items ?? [],
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json(
            {
              folderId: "01_Main_Screen",
              source: "local-mirror",
              driveEnabled: false,
              items: [],
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
