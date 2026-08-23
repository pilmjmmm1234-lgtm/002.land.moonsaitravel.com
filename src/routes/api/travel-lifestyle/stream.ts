import { createFileRoute } from "@tanstack/react-router";
import { extractDriveFileId } from "@/lib/image-proxy";
import {
  driveIdFromStreamRequest,
  streamPublicDriveVideo,
} from "@/lib/drive/public-video.server";

async function handle(request: Request): Promise<Response> {
  const fileId = driveIdFromStreamRequest(request);
  if (fileId) {
    return streamPublicDriveVideo(fileId, request.headers.get("range"));
  }

  const u = new URL(request.url);
  const src = u.searchParams.get("src")?.trim() || "";
  if (!src) return new Response("Missing src", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return new Response("Invalid src", { status: 400 });
  }

  const host = parsed.hostname.toLowerCase();
  const allowed =
    host === "drive.google.com" ||
    host === "drive.usercontent.google.com" ||
    host.endsWith(".googleusercontent.com") ||
    host === "script.google.com" ||
    host === "script.googleusercontent.com";
  if (!allowed) return new Response("Host not allowed", { status: 400 });

  const id = extractDriveFileId(src);
  if (id) return streamPublicDriveVideo(id, request.headers.get("range"));
  return new Response("Missing file id", { status: 400 });
}

export const Route = createFileRoute("/api/travel-lifestyle/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
    },
  },
});
