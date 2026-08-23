import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PRIVATE_PIN_DEFAULT } from "@/content/admin";
import {
  SAMPLE_INQUIRY_BODY,
  SAMPLE_INQUIRY_SUBJECT,
} from "@/content/site-profile";

export type InquirySettings = {
  fromEmail: string;
  pin: string;
  introUrl: string;
  subject: string;
  body: string;
  appsScriptUrl: string;
};

export type InquiryLog = {
  at: string;
  to: string;
  from: string;
  ok: boolean;
  error?: string;
};

const FILE = path.join(process.cwd(), "data", "inquiry-settings.json");
const LOG_FILE = path.join(process.cwd(), "data", "inquiry-log.json");

export function defaultInquirySettings(): InquirySettings {
  return {
    fromEmail: "",
    pin: PRIVATE_PIN_DEFAULT,
    introUrl: "",
    subject: SAMPLE_INQUIRY_SUBJECT,
    body: SAMPLE_INQUIRY_BODY,
    appsScriptUrl: "",
  };
}

export async function readInquirySettings(): Promise<InquirySettings> {
  const base = defaultInquirySettings();
  try {
    const raw = await readFile(FILE, "utf8");
    const src = JSON.parse(raw) as Partial<InquirySettings>;
    if (typeof src.fromEmail === "string") base.fromEmail = src.fromEmail.trim();
    if (typeof src.pin === "string" && src.pin.trim()) base.pin = src.pin.trim();
    if (typeof src.introUrl === "string") base.introUrl = src.introUrl.trim();
    if (typeof src.subject === "string" && src.subject.trim()) {
      base.subject = src.subject;
    }
    if (typeof src.body === "string" && src.body.trim()) base.body = src.body;
    if (typeof src.appsScriptUrl === "string") {
      base.appsScriptUrl = src.appsScriptUrl.trim();
    }
  } catch {
    /* defaults */
  }
  return base;
}

export async function writeInquirySettings(
  next: Partial<InquirySettings>,
): Promise<InquirySettings> {
  const cur = await readInquirySettings();
  const saved: InquirySettings = {
    fromEmail:
      typeof next.fromEmail === "string" ? next.fromEmail.trim() : cur.fromEmail,
    pin: typeof next.pin === "string" && next.pin.trim() ? next.pin.trim() : cur.pin,
    introUrl:
      typeof next.introUrl === "string" ? next.introUrl.trim() : cur.introUrl,
    subject:
      typeof next.subject === "string" && next.subject.trim()
        ? next.subject
        : cur.subject,
    body:
      typeof next.body === "string" && next.body.trim() ? next.body : cur.body,
    appsScriptUrl:
      typeof next.appsScriptUrl === "string"
        ? next.appsScriptUrl.trim()
        : cur.appsScriptUrl,
  };
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  return saved;
}

export function fillInquiryTemplate(
  template: string,
  settings: InquirySettings,
): string {
  return template
    .replaceAll("{{pin}}", settings.pin)
    .replaceAll("{{url}}", settings.introUrl || "(not set yet)");
}

export async function readInquiryLog(): Promise<InquiryLog[]> {
  try {
    const raw = await readFile(LOG_FILE, "utf8");
    const src = JSON.parse(raw) as unknown;
    if (!Array.isArray(src)) return [];
    return src.filter(
      (row): row is InquiryLog =>
        !!row &&
        typeof row === "object" &&
        typeof (row as InquiryLog).at === "string" &&
        typeof (row as InquiryLog).to === "string",
    );
  } catch {
    return [];
  }
}

export async function appendInquiryLog(entry: InquiryLog): Promise<InquiryLog[]> {
  const prev = await readInquiryLog();
  const next = [entry, ...prev].slice(0, 40);
  await mkdir(path.dirname(LOG_FILE), { recursive: true });
  await writeFile(LOG_FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}