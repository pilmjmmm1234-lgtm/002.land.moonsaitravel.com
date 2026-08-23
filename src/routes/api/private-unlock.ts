import { createFileRoute } from "@tanstack/react-router";
import { normalizePin } from "@/content/admin";
import { readInquirySettings } from "@/lib/inquiry-settings.server";

export const Route = createFileRoute("/api/private-unlock")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { pin?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ ok: false }, { status: 400 });
        }
        const pin = String(body.pin ?? "");
        const settings = await readInquirySettings();
        if (normalizePin(pin) !== normalizePin(settings.pin)) {
          return Response.json({ ok: false }, { status: 403 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});