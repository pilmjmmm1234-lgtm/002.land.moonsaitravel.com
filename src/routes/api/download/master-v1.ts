import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/download/master-v1")({
  server: {
    handlers: {
      GET: async () =>
        new Response("gone", {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        }),
    },
  },
});
