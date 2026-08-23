"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteBackLink, SiteMenu } from "@/components/site-menu";
import { ADMIN_PIN, ADMIN_SESSION_KEY, normalizePin } from "@/content/admin";
import { IS_MEMBER_TEMPLATE } from "@/content/site-profile";
import { invalidateTravelExperienceCache } from "@/lib/travel-experience-cache";
import {
  defaultMenuConfig,
  loadMenuConfig,
  publicModelsFolderUrl,
  resetMenuConfig,
  saveMenuConfig,
  type MenuConfig,
} from "@/lib/menu-config";
import { setPrivatePin } from "@/lib/private-pin";

const SYNC_KEY = "travel-admin-last-sync";
const STATUS_KEY = "travel-admin-drive-status";

type OfficeTab =
  | "overview"
  | "brand"
  | "home"
  | "models"
  | "private"
  | "contact"
  | "drive"
  | "advanced";

type DriveStatus = "idle" | "loading" | "connected" | "error";

type InquiryMailLog = {
  at: string;
  to: string;
  from: string;
  ok: boolean;
  error?: string;
};

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin Office" }],
  }),
});

function safeConfig(): MenuConfig {
  try {
    return loadMenuConfig();
  } catch {
    return defaultMenuConfig();
  }
}

function isUnlocked(): boolean {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function AdminPage() {
  const [gate, setGate] = useState(() => isUnlocked());
  const [pin, setPin] = useState("");
  const [gateError, setGateError] = useState("");

  if (!gate) {
    return (
      <main className="min-h-dvh bg-bg text-fg">
        <SiteMenu variant="admin" />
        <SiteBackLink to="/">← Home</SiteBackLink>
        <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center px-6">
          <p className="text-center font-display text-[0.72rem] tracking-[0.28em] text-[#e8d5a3]">
            ADMIN OFFICE
          </p>
          <h1 className="mt-3 text-center font-display text-xl font-semibold">
            Enter password
          </h1>
          <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (normalizePin(pin) === normalizePin(ADMIN_PIN)) {
                try {
                  window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
                } catch {
                  /* ignore */
                }
                setGate(true);
                return;
              }
              setGateError("Password is not correct.");
            }}
          >
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              className="rounded-sm border border-fg/15 bg-bg-elevated px-3 py-2 text-center text-sm text-fg outline-none focus:border-[#e8d5a3]/50"
            />
            {gateError ? (
              <p className="text-center text-xs text-red-300">{gateError}</p>
            ) : null}
            <button
              type="submit"
              className="min-h-10 rounded-sm border border-[#e8d5a3]/35 bg-[#e8d5a3]/12 text-sm text-[#f3ead4]"
            >
              Open
            </button>
          </form>
        </div>
      </main>
    );
  }

  return <AdminOffice />;
}

function AdminOffice() {
  const [tab, setTab] = useState<OfficeTab>("overview");
  const [config, setConfig] = useState<MenuConfig>(() => safeConfig());
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState("");
  const [status, setStatus] = useState<DriveStatus>("idle");
  const [statusNote, setStatusNote] = useState("");
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [mailConfigured, setMailConfigured] = useState(false);
  const [mailLog, setMailLog] = useState<InquiryMailLog[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  const applyInquiryPayload = (data: {
    settings?: {
      fromEmail?: string;
      pin?: string;
      introUrl?: string;
      subject?: string;
      body?: string;
      appsScriptUrl?: string;
    };
    mailConfigured?: boolean;
    log?: InquiryMailLog[];
  }) => {
    if (typeof data.mailConfigured === "boolean") setMailConfigured(data.mailConfigured);
    if (Array.isArray(data.log)) setMailLog(data.log);
    const s = data.settings;
    if (!s) return;
    setConfig((c) => ({
      ...c,
      contactEmail: s.fromEmail?.trim() || c.contactEmail,
      privatePassword: s.pin?.trim() || c.privatePassword,
      introHomepageUrl: s.introUrl ?? c.introHomepageUrl,
      inquirySubject: s.subject || c.inquirySubject,
      inquiryBody: s.body || c.inquiryBody,
          inquiryAppsScriptUrl: s.appsScriptUrl ?? c.inquiryAppsScriptUrl,
    }));
  };

  useEffect(() => {
    setConfig(safeConfig());
    try {
      setLastSync(window.localStorage.getItem(SYNC_KEY) || "");
      const st = window.localStorage.getItem(STATUS_KEY);
      if (st === "connected" || st === "error") setStatus(st);
    } catch {
      /* ignore */
    }
    void fetch("/api/inquiry-settings", {
      headers: { "x-admin-pin": ADMIN_PIN },
    })
      .then((r) => r.json())
      .then((data) => applyInquiryPayload(data as Parameters<typeof applyInquiryPayload>[0]))
      .catch(() => undefined);
  }, []);

  const persist = (next: MenuConfig) => {
    const root = next.destGallery?.rootFolderUrl ?? "";
    const synced: MenuConfig = {
      ...next,
      destGallery: {
        ...defaultMenuConfig().destGallery,
        ...next.destGallery,
        rootFolderUrl: root,
        publicFolderUrl: root,
      },
    };
    saveMenuConfig(synced);
    if (synced.privatePassword.trim()) setPrivatePin(synced.privatePassword.trim());
    void fetch("/api/inquiry-settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": ADMIN_PIN,
      },
      body: JSON.stringify({
        fromEmail: synced.contactEmail,
        pin: synced.privatePassword,
        introUrl: synced.introHomepageUrl,
        subject: synced.inquirySubject,
        body: synced.inquiryBody,
        appsScriptUrl: synced.inquiryAppsScriptUrl,
      }),
    })
      .then((r) => r.json())
      .then((data) => applyInquiryPayload(data as Parameters<typeof applyInquiryPayload>[0]))
      .catch(() => undefined);
    setConfig(safeConfig());
    return synced;
  };

  const refreshCards = async (nextConfig?: MenuConfig) => {
    const cfg = nextConfig ?? config;
    setBusy(true);
    setStatus("loading");
    setStatusNote("");
    invalidateTravelExperienceCache();
    try {
      const folder = publicModelsFolderUrl(cfg.destGallery);
      const cover = cfg.destGallery?.coverFileName || "cover.jpg";
      if (!folder.trim()) {
        setStatus("idle");
        setStatusNote("Add a Travel_Content folder link first.");
        setModels([]);
        return;
      }
      const qs = new URLSearchParams({ scope: "debug", cover, folder });
      const res = await fetch(`/api/travel-experience/destinations?${qs}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not read Drive folder");
      const data = (await res.json()) as {
        models?: { id: string; name: string }[];
      };
      setModels(data.models ?? []);
      const stamp = new Date().toLocaleString();
      setLastSync(stamp);
      setStatus("connected");
      try {
        window.localStorage.setItem(SYNC_KEY, stamp);
        window.localStorage.setItem(STATUS_KEY, "connected");
      } catch {
        /* ignore */
      }
    } catch (err) {
      setStatus("error");
      setStatusNote(err instanceof Error ? err.message : "Refresh failed");
      try {
        window.localStorage.setItem(STATUS_KEY, "error");
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  };

  const onSave = () => {
    try {
      const next = persist(config);
      setSaved("Saved.");
      void refreshCards(next);
    } catch {
      setSaved("Save failed.");
    }
    window.setTimeout(() => setSaved(""), 2800);
  };

  const onReset = () => {
    if (!window.confirm("Reset all site settings to default?")) return;
    const next = resetMenuConfig();
    setPrivatePin(next.privatePassword);
    setConfig(next);
    setModels([]);
    setSaved("Reset to default.");
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "travel-site-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text()) as MenuConfig;
      persist(raw);
      setSaved("Imported.");
    } catch {
      setSaved("Import failed.");
    }
  };

  const patch = (partial: Partial<MenuConfig>) =>
    setConfig((c) => ({ ...c, ...partial }));
  const rootUrl = config.destGallery?.rootFolderUrl ?? "";
  const statusLabel =
    status === "loading"
      ? "Loading"
      : status === "connected"
        ? "Connected"
        : status === "error"
          ? "Error"
          : "Not connected";

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <SiteMenu variant="admin" />
      <SiteBackLink to="/">← Home</SiteBackLink>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-[max(2.5rem,var(--grok-banner-h,1.5rem))] sm:px-8">
        <p className="font-display text-[0.68rem] tracking-[0.32em] text-[#e8d5a3]">
          {IS_MEMBER_TEMPLATE ? "MEMBER TEMPLATE" : "OWNER SITE"}
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold tracking-[0.08em] sm:text-2xl">
          Admin Office
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[11.5rem_minmax(0,1fr)]">
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {(
              [
                ["overview", "Overview"],
                ["brand", "Brand"],
                ["home", "Home Text"],
                ["models", "Model Cards"],
                ["private", "Private Access"],
                ["contact", "Contact"],
                ["drive", "Google Drive"],
                ["advanced", "Advanced"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-sm px-3 py-2 text-left text-[0.78rem] tracking-wide ${
                  tab === id
                    ? "border border-[#e8d5a3]/35 bg-[#e8d5a3]/12 text-[#f3ead4]"
                    : "border border-transparent text-fg-muted hover:bg-fg/6"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex flex-col gap-5">
            {tab === "overview" ? (
              <Panel>
                <p className="text-sm text-fg-muted">
                  Change brand, text, email, password, and Drive folder here.
                  Save, then Refresh Cards to load models.
                </p>
                <p className="mt-3 text-[0.78rem] text-fg-muted">
                  Connection: {statusLabel}
                  {statusNote ? ` · ${statusNote}` : ""}
                </p>
                <p className="text-[0.78rem] text-fg-muted">
                  Last sync: {lastSync || "—"}
                </p>
              </Panel>
            ) : null}

            {tab === "brand" ? (
              <Panel>
                <Field label="Brand / Logo Text" value={config.brandLogoText} onChange={(v) => patch({ brandLogoText: v })} />
                <Field label="Site Title / Browser Title" value={config.siteTitle} onChange={(v) => patch({ siteTitle: v })} />
                <Field label="Footer Text" value={config.footerText} onChange={(v) => patch({ footerText: v })} />
                <label className="block text-[0.7rem] tracking-wide text-fg-muted">
                  Theme Accent Color
                  <div className="mt-1 flex items-center gap-3">
                    <input type="color" value={config.themeAccent} onChange={(e) => patch({ themeAccent: e.target.value })} className="h-9 w-12 cursor-pointer rounded-sm border border-fg/15 bg-bg" />
                    <input type="text" value={config.themeAccent} onChange={(e) => patch({ themeAccent: e.target.value })} className="w-full rounded-sm border border-fg/15 bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-[#e8d5a3]/40" />
                  </div>
                </label>
              </Panel>
            ) : null}

            {tab === "home" ? (
              <Panel>
                <Field label="Main Title" value={config.page2Title} onChange={(v) => patch({ page2Title: v })} />
                <NumberField label="Main Title Font Size (px)" value={config.page2TitleSize} onChange={(v) => patch({ page2TitleSize: v })} />
                <Area label="Subtitle / Description" value={config.page2Sub} onChange={(v) => patch({ page2Sub: v })} />
                <NumberField label="Subtitle Font Size (px)" value={config.page2SubSize} onChange={(v) => patch({ page2SubSize: v })} />
              </Panel>
            ) : null}

            {tab === "models" ? (
              <Panel>
                <NumberField label="Model Name Font Size (px)" value={config.modelNameSize} onChange={(v) => patch({ modelNameSize: v })} />
                <p className="text-[0.72rem] text-fg-muted">
                  Default is the Drive folder name. A custom name here is shown instead.
                </p>
                {models.length === 0 ? (
                  <p className="text-[0.72rem] text-fg-muted">Refresh Cards to load model folders.</p>
                ) : (
                  models.map((m) => (
                    <Field
                      key={m.id}
                      label={m.name}
                      value={config.modelLabels[m.id] ?? ""}
                      placeholder={m.name}
                      onChange={(v) => patch({ modelLabels: { ...config.modelLabels, [m.id]: v } })}
                    />
                  ))
                )}
              </Panel>
            ) : null}

            {tab === "private" ? (
              <Panel>
                <Field label="Private Password" value={config.privatePassword} onChange={(v) => patch({ privatePassword: v })} />
                <Area label="Private Access Message" value={config.privateAccessMessage} onChange={(v) => patch({ privateAccessMessage: v })} />
              </Panel>
            ) : null}

            {tab === "contact" ? (
              <Panel>
                <Area label="Bottom CTA Text" value={config.ctaText} onChange={(v) => patch({ ctaText: v })} />
                <Field label="Email Button Text" value={config.emailButtonText} onChange={(v) => patch({ emailButtonText: v })} />
                <Field
                  label="Google Apps Script Web App URL"
                  value={config.inquiryAppsScriptUrl}
                  onChange={(v) => patch({ inquiryAppsScriptUrl: v })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
                <Field
                  label="Sending Email Address"
                  value={config.contactEmail}
                  onChange={(v) => patch({ contactEmail: v })}
                  placeholder="hello@yourdomain.com"
                />
                <Field
                  label="PRIVATE Card Access Number"
                  value={config.privatePassword}
                  onChange={(v) => patch({ privatePassword: v })}
                />
                <Field
                  label="Introduction Homepage URL"
                  value={config.introHomepageUrl}
                  onChange={(v) => patch({ introHomepageUrl: v })}
                  placeholder="https://"
                />
                <Field
                  label="Auto-reply Subject"
                  value={config.inquirySubject}
                  onChange={(v) => patch({ inquirySubject: v })}
                />
                <Area
                  label="Auto-reply Body  (use {{pin}} and {{url}})"
                  value={config.inquiryBody}
                  onChange={(v) => patch({ inquiryBody: v })}
                />
                <div className="rounded-sm border border-fg/12 bg-black/25 px-3 py-3">
                  <p className="text-[0.7rem] tracking-wide text-fg-muted uppercase">
                    Mail send status
                  </p>
                  <p className="mt-1 text-[0.82rem] text-fg">
                    {mailConfigured
                      ? "Google Apps Script is connected. Auto-replies can be sent from your Gmail account."
                      : "Paste your Apps Script Web App URL above, then Save Settings."}
                  </p>
                  {mailLog.length === 0 ? (
                    <p className="mt-2 text-[0.72rem] text-fg-muted">No send attempts yet.</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {mailLog.slice(0, 8).map((row) => (
                        <li
                          key={`${row.at}-${row.to}`}
                          className="text-[0.72rem] leading-relaxed text-fg/85"
                        >
                          <span className={row.ok ? "text-emerald-300/90" : "text-rose-300/90"}>
                            {row.ok ? "Sent" : "Failed"}
                          </span>
                          {" · "}
                          {new Date(row.at).toLocaleString()}
                          {" · "}
                          {row.to}
                          {row.error ? ` · ${row.error}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-[0.72rem] leading-relaxed text-fg-muted">
                  Saving here updates auto-reply immediately — no rebuild needed.
                  Deploy the Gmail Apps Script as a Web app (Execute as Me, Anyone)
                  and paste the URL. Gmail passwords are never stored on this site.
                  Use {"{{pin}}"} and {"{{url}}"}. The visitor's website language
                  chooses the auto-reply language. These English fields are the default.
                </p>
              </Panel>
            ) : null}

            {tab === "drive" ? (
              <Panel>
                <Field
                  label="Google Drive Travel_Content Folder Link"
                  value={rootUrl}
                  onChange={(v) =>
                    setConfig((c) => ({
                      ...c,
                      destGallery: {
                        ...defaultMenuConfig().destGallery,
                        ...c.destGallery,
                        rootFolderUrl: v,
                        publicFolderUrl: v,
                      },
                    }))
                  }
                />
                <p className="text-[0.78rem] text-fg-muted">Connection: {statusLabel}</p>
                <p className="text-[0.78rem] text-fg-muted">Last sync: {lastSync || "—"}</p>
              </Panel>
            ) : null}

            {tab === "advanced" ? (
              <Panel>
                <p className="text-sm text-fg-muted">
                  Export a settings file, or import one on another copy of this site.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={onExport} className="min-h-9 rounded-sm border border-fg/18 px-4 text-sm">
                    Export Settings
                  </button>
                  <button type="button" onClick={() => importRef.current?.click()} className="min-h-9 rounded-sm border border-fg/18 px-4 text-sm">
                    Import Settings
                  </button>
                  <button type="button" onClick={onReset} className="min-h-9 rounded-sm border border-fg/12 px-4 text-sm text-fg/70">
                    Reset to Default
                  </button>
                </div>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onImport(file);
                    e.target.value = "";
                  }}
                />
              </Panel>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={onSave} className="min-h-10 rounded-sm border border-[#e8d5a3]/40 bg-[#e8d5a3]/14 px-5 text-sm font-medium text-[#f3ead4]">
                Save Settings
              </button>
              <button type="button" onClick={() => void refreshCards()} disabled={busy} className="min-h-10 rounded-sm border border-fg/18 px-4 text-sm disabled:opacity-50">
                {busy ? "Refreshing…" : "Refresh Cards"}
              </button>
              {saved ? <span className="text-xs text-fg-muted">{saved}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-[#e8d5a3]/16 bg-black/35 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-[0.7rem] tracking-wide text-fg-muted">
      {label}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-fg/15 bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-[#e8d5a3]/40"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[0.7rem] tracking-wide text-fg-muted">
      {label}
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-fg/15 bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-[#e8d5a3]/40"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-[0.7rem] tracking-wide text-fg-muted">
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-sm border border-fg/15 bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-[#e8d5a3]/40"
      />
    </label>
  );
}