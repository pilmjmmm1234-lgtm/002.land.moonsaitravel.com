import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const FILE = "Moons_AI_Travel_Promo_Videos.zip";

export const Route = createFileRoute("/api/download/promo-videos")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const buf = await readFile(join(process.cwd(), "public", FILE));
          return new Response(buf, {
            status: 200,
            headers: {
              "Content-Type": "application/zip",
              "Content-Length": String(buf.byteLength),
              "Content-Disposition": `attachment; filename="${FILE}"`,
              "Cache-Control": "no-store",
            },
          });
        } catch {
          return new Response("file not found", { status: 404 });
        }
      },
    },
  },
});
