import { createFileRoute } from "@tanstack/react-router";

type Lead = {
  email: string;
  destination: string;
  at: string;
};

const leads: Lead[] = [];

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Email capture endpoint for the SNS landing.
 * Stores leads in memory for now — swap this handler for a real mailbox later.
 */
export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { email?: string; destination?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ ok: false, error: "invalid" }, { status: 400 });
        }
        const email = String(body.email ?? "").trim().toLowerCase();
        const destination = String(body.destination ?? "").trim();
        if (!validEmail(email)) {
          return Response.json({ ok: false, error: "email" }, { status: 400 });
        }
        leads.push({
          email,
          destination,
          at: new Date().toISOString(),
        });
        if (leads.length > 500) leads.splice(0, leads.length - 500);
        return Response.json({ ok: true });
      },
    },
  },
});
