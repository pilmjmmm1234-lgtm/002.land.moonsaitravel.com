import { isKnownLocale } from "@/locales/catalog";
import {
  SAMPLE_INQUIRY_BODY,
  SAMPLE_INQUIRY_SUBJECT,
} from "@/content/site-profile";
import type { InquirySettings } from "@/lib/inquiry-settings.server";

const localeModules = import.meta.glob("../locales/*.json") as Record<
  string,
  () => Promise<{ default?: { inquiryMailSubject?: string; inquiryMailBody?: string } }>
>;

export async function mailCopyForLocale(
  localeRaw: string,
  settings: InquirySettings,
): Promise<{ subject: string; body: string; locale: string }> {
  const locale = isKnownLocale(localeRaw) ? localeRaw : "en";
  const loader =
    localeModules[`../locales/${locale}.json`] ||
    localeModules["../locales/en.json"];
  let subject = SAMPLE_INQUIRY_SUBJECT;
  let body = SAMPLE_INQUIRY_BODY;
  if (loader) {
    try {
      const mod = await loader();
      const dict = mod.default || {};
      if (dict.inquiryMailSubject?.trim()) subject = dict.inquiryMailSubject;
      if (dict.inquiryMailBody?.trim()) body = dict.inquiryMailBody;
    } catch {
      /* keep sample */
    }
  }
  if (locale === "en") {
    if (settings.subject.trim()) subject = settings.subject;
    if (settings.body.trim()) body = settings.body;
  }
  return { subject, body, locale };
}