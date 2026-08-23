import { createFileRoute } from "@tanstack/react-router";
import { streamGoogleDriveFile } from "@/lib/drive/client.server";

export const Route = createFileRoute("/api/drive/file/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const fileId = params.fileId;
        if (!fileId || fileId.startsWith("local:")) {
          return new Response("Not found", { status: 404 });
        }
        try {
          return await streamGoogleDriveFile(fileId);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to stream file";
          return new Response(message, { status: 502 });
        }
      },
    },
  },
});
