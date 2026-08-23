import { createFileRoute } from "@tanstack/react-router";
import { mailCopyForLocale } from "@/lib/inquiry-mail-locale.server";
import {
  appendInquiryLog,
  fillInquiryTemplate,
  readInquirySettings,
} from "@/lib/inquiry-settings.server";
import { sendAutoReply } from "@/lib/send-mail.server";

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const recent = new Map<string, number>();

function tooSoon(email: string): boolean {
  const now = Date.now();
  const prev = recent.get(email) || 0;
  if (now - prev < 60_000) return true;
  recent.set(email, now);
  if (recent.size > 400) {
    const cutoff = now - 60 * 60 * 1000;
    for (const [k, t] of recent) if (t < cutoff) recent.delete(k);
  }
  return false;
}

export const Route = createFileRoute("/api/inquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { email?: string; locale?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ ok: false, error: "invalid" }, { status: 400 });
        }
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!validEmail(email)) {
          return Response.json({ ok: false, error: "email" }, { status: 400 });
        }
        if (tooSoon(email)) {
          return Response.json({ ok: false, error: "wait" }, { status: 429 });
        }

        const settings = await readInquirySettings();
        const copy = await mailCopyForLocale(String(body.locale || "en"), settings);
        const subject = fillInquiryTemplate(copy.subject, settings);
        const text = fillInquiryTemplate(copy.body, settings);
        const sent = await sendAutoReply({
          to: email,
          subject,
          text,
          pin: settings.pin,
          introUrl: settings.introUrl,
          fromEmail: settings.fromEmail,
          appsScriptUrl: settings.appsScriptUrl,
        });
        await appendInquiryLog({
          at: new Date().toISOString(),
          to: email,
          from: sent.from,
          ok: sent.ok,
          error: sent.ok ? undefined : sent.error,
        });
        if (!sent.ok) {
          return Response.json(
            { ok: false, error: sent.error },
            {
              status:
                sent.error === "mail_not_configured" || sent.error === "missing_from"
                  ? 503
                  : 502,
            },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});