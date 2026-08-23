/**
 * Sends auto-reply through the owner's Google Apps Script web app.
 * The Gmail account that deployed the script is the sender.
 * No Resend / SMTP keys are used.
 */
function isAppsScriptUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return (
      host === "script.google.com" ||
      host === "script.googleusercontent.com"
    );
  } catch {
    return false;
  }
}

export async function sendAutoReply(opts: {
  to: string;
  subject: string;
  text: string;
  pin: string;
  introUrl: string;
  fromEmail?: string;
  appsScriptUrl: string;
}): Promise<{ ok: true; from: string } | { ok: false; error: string; from: string }> {
  const from = (opts.fromEmail || "").trim();
  const endpoint = opts.appsScriptUrl.trim();
  if (!endpoint || !isAppsScriptUrl(endpoint)) {
    return { ok: false, error: "mail_not_configured", from };
  }

  const payload = {
    to: opts.to,
    subject: opts.subject,
    body: opts.text,
    text: opts.text,
    pin: opts.pin,
    url: opts.introUrl,
    fromEmail: from,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    let parsed: { success?: boolean; ok?: boolean; error?: string } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      /* Apps Script sometimes returns HTML on auth/deploy errors */
    }
    const ok =
      res.ok &&
      parsed.error == null &&
      (parsed.success === true || parsed.ok === true || raw.includes('"success":true'));
    if (!ok) {
      return { ok: false, error: parsed.error || "send_failed", from };
    }
    return { ok: true, from };
  } catch {
    return { ok: false, error: "send_failed", from };
  }
}