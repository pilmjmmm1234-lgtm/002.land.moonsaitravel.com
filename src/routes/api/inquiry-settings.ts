import { createFileRoute } from "@tanstack/react-router";
import { ADMIN_PIN, normalizePin } from "@/content/admin";
import {
  readInquiryLog,
  readInquirySettings,
  writeInquirySettings,
} from "@/lib/inquiry-settings.server";

function mailReady(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "script.google.com" || host === "script.googleusercontent.com";
  } catch {
    return false;
  }
}

function adminOk(request: Request): boolean {
  const header = request.headers.get("x-admin-pin") || "";
  const envPin = (process.env.ADMIN_PIN || "").trim();
  const expected = envPin || ADMIN_PIN;
  return normalizePin(header) === normalizePin(expected);
}

export const Route = createFileRoute("/api/inquiry-settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!adminOk(request)) {
          return Response.json({ ok: false }, { status: 401 });
        }
        const settings = await readInquirySettings();
        const log = await readInquiryLog();
        return Response.json({
          ok: true,
          settings,
          mailConfigured: mailReady(settings.appsScriptUrl),
          log,
        });
      },
      PUT: async ({ request }) => {
        if (!adminOk(request)) {
          return Response.json({ ok: false }, { status: 401 });
        }
        let body: {
          fromEmail?: string;
          pin?: string;
          introUrl?: string;
          subject?: string;
          body?: string;
          appsScriptUrl?: string;
        } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ ok: false, error: "invalid" }, { status: 400 });
        }
        const settings = await writeInquirySettings(body);
        const log = await readInquiryLog();
        return Response.json({
          ok: true,
          settings,
          mailConfigured: mailReady(settings.appsScriptUrl),
          log,
        });
      },
    },
  },
});