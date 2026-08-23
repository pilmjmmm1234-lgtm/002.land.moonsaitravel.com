"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { InfoNav } from "@/components/info-nav";
import { SiteMenu } from "@/components/site-menu";
import { SiteFooter } from "@/components/site-footer";
import { JOIN_COPY } from "@/content/join/copy";
import { MWR_SIGNUP_URL } from "@/content/join/links";
import { useMenuConfig } from "@/lib/menu-config";
import { fitTypeSize, useIsMobile } from "@/lib/use-is-mobile";

export function JoinDesk({ mode }: { mode: "membership" | "faq" }) {
  const t = JOIN_COPY;
  const { join, page5Title, page5Sub, page5TitleSize, page5SubSize } =
    useMenuConfig();
  const mobile = useIsMobile();
  const titlePx = fitTypeSize(page5TitleSize, mobile, 22);
  const subPx = fitTypeSize(page5SubSize, mobile, 14);
  const [understood, setUnderstood] = useState(false);
  const [copied, setCopied] = useState(false);
  const [consentChoice, setConsentChoice] = useState<"cancel" | "agree" | null>(
    null,
  );
  const [openStep, setOpenStep] = useState<string | null>(null);

  const openExternal = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    window.open(trimmed, "_blank", "noopener,noreferrer");
  };

  const heading =
    mode === "membership" ? "멤버십 안내" : "가입 전 확인사항";
  const sub =
    mode === "membership"
      ? "회원제 여행 서비스의 구성과 이용 방식을 확인해 보세요."
      : "비용, 조건, 환불 및 해지 사항은 공식 자료에서 직접 확인하시기 바랍니다.";

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <SiteMenu variant="info" />

      <div className="mx-auto w-full max-w-3xl px-5 pb-14 pt-[max(2.5rem,var(--grok-banner-h,1.5rem))] sm:px-8 sm:pb-20 sm:pt-[max(3.25rem,var(--grok-banner-h,2rem))]">
        <header className="mb-6 text-center sm:mb-8">
          <h1
            className="font-display font-semibold tracking-[0.08em] text-[var(--color-traveler)] break-words sm:tracking-[0.16em]"
            style={{ fontSize: `${titlePx}px` }}
          >
            {mode === "membership" ? heading : page5Title || heading}
          </h1>
          <p
            className="mx-auto mt-3 max-w-lg whitespace-pre-line leading-relaxed text-[var(--color-traveler-muted)] break-words"
            style={{ fontSize: `${subPx}px` }}
          >
            {mode === "membership" ? sub : page5Sub || sub}
          </p>
        </header>

        <InfoNav />

        <div className="flex flex-col gap-8 sm:gap-10">
          {mode === "membership" ? (
            <>
              <SectionCard number={t.about.number} title={t.about.title}>
                <p className="text-sm leading-relaxed text-fg/80 sm:text-[0.9375rem]">
                  {t.about.body}
                </p>
                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  <DualActionButton
                    label={t.about.guideCta}
                    hint=""
                    onClick={() => openExternal(join.guide)}
                  />
                  <DualActionButton
                    label={t.about.videoCta}
                    hint=""
                    onClick={() => openExternal(join.video)}
                  />
                </div>
              </SectionCard>

              <SectionCard number={t.why.number} title={t.why.title}>
                <p className="text-sm leading-relaxed text-fg/80 sm:text-[0.9375rem]">
                  {t.why.body}
                </p>
                <div className="mt-5 max-w-sm">
                  <DualActionButton
                    label={t.why.cta}
                    hint=""
                    onClick={() => openExternal(join.membership)}
                  />
                </div>
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard number={t.before.number} title={t.before.title}>
                <ul className="flex flex-col gap-2.5">
                  {t.before.checks.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-fg/85"
                    >
                      <span
                        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-fg/20 text-accent"
                        aria-hidden="true"
                      >
                        <Check className="size-2.5" strokeWidth={2.5} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs leading-relaxed text-fg-muted sm:text-[0.8125rem]">
                  {t.before.note}
                </p>
              </SectionCard>

              <SectionCard number={t.how.number} title={t.how.title}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {t.how.steps.map((s) => {
                    const open = openStep === s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        aria-expanded={open}
                        onClick={() =>
                          setOpenStep((cur) => (cur === s.step ? null : s.step))
                        }
                        className="flex flex-col rounded-sm border border-fg/12 bg-bg/35 px-3 py-3.5 text-left backdrop-blur-sm transition-[border-color,background-color] duration-(--motion-fast) hover:border-fg/20 hover:bg-bg/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/40 sm:px-3.5 sm:py-4"
                      >
                        <p className="text-[0.6rem] font-medium tracking-[0.14em] text-accent uppercase">
                          {s.step}
                        </p>
                        <p className="mt-2 text-xs leading-snug text-fg/85 sm:text-[0.8125rem]">
                          {s.title}
                        </p>
                        <div
                          className="grid transition-[grid-template-rows,opacity] duration-300 ease-(--ease-smooth-out)"
                          style={{
                            gridTemplateRows: open ? "1fr" : "0fr",
                            opacity: open ? 1 : 0,
                          }}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <p className="mt-3 border-t border-fg/10 pt-3 text-[0.7rem] leading-relaxed text-fg-muted sm:text-xs">
                              {s.detail}
                            </p>
                          </div>
                        </div>
                        <span className="mt-3 self-end text-[0.58rem] tracking-wide text-fg/55">
                          {open ? t.how.collapse : t.how.expand}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              <section
                aria-labelledby="join-official-title"
                className="rounded-md border border-fg/14 bg-bg-elevated/55 px-5 py-6 shadow-[0_8px_28px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:px-7 sm:py-8"
              >
                <p className="text-[0.65rem] font-medium tracking-[0.2em] text-fg-subtle">
                  {t.official.number}
                </p>
                <h2
                  id="join-official-title"
                  className="mt-1.5 font-display text-sm font-semibold tracking-[0.08em] text-fg sm:text-base sm:tracking-[0.1em]"
                >
                  {t.official.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-[0.9375rem]">
                  {t.official.role}
                </p>
                <ul className="mt-5 rounded-sm border border-fg/12 bg-bg/40 px-3.5 py-3.5 sm:px-4 sm:py-4">
                  {t.official.trust.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 py-1.5 text-xs leading-relaxed text-fg/85 sm:text-[0.8125rem]"
                    >
                      <span
                        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-fg/20 text-accent"
                        aria-hidden="true"
                      >
                        <Check className="size-2.5" strokeWidth={2.5} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <label className="mt-6 flex cursor-pointer items-start gap-3 text-left">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => {
                      setUnderstood(e.target.checked);
                      if (!e.target.checked) {
                        setCopied(false);
                        setConsentChoice(null);
                      }
                    }}
                    className="mt-0.5 size-5 shrink-0 rounded border border-fg/25 bg-bg accent-fg min-[769px]:size-4"
                  />
                  <span className="text-xs leading-relaxed text-fg/80 sm:text-[0.8125rem]">
                    {t.official.checkbox}
                    <br />
                    (개인정보 수집 동의가 아닙니다)
                  </span>
                </label>

                <div className="mt-5 flex gap-2">
                  <input
                    readOnly
                    value={join.signup}
                    aria-label="추천 링크"
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-h-11 min-w-0 flex-1 rounded-sm border border-fg/18 bg-bg/50 px-3 font-mono text-[0.7rem] break-all text-fg/90 outline-none sm:text-xs"
                  />
                  <button
                    type="button"
                    disabled={!understood}
                    onClick={async () => {
                      if (!understood) return;
                      const url = join.signup.trim();
                      if (!url) return;
                      try {
                        await navigator.clipboard.writeText(url);
                        setCopied(true);
                      } catch {
                        /* ignore */
                      }
                    }}
                    className={`shrink-0 rounded-sm px-4 text-[0.7rem] font-medium tracking-wide transition-opacity duration-(--motion-fast) sm:text-xs ${
                      understood
                        ? "bg-fg text-bg"
                        : "bg-fg text-bg opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    {copied ? "복사됨" : "복사"}
                  </button>
                </div>
                <p className="mt-2 text-[0.65rem] leading-relaxed text-fg-muted sm:text-xs">
                  공식 페이지의 주소와 내용을 확인한 뒤, 본인 판단으로 진행하세요.
                  수익이나 무료 여행은 보장되지 않습니다.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConsentChoice("cancel");
                      setUnderstood(false);
                      setCopied(false);
                    }}
                    className="min-h-9 rounded-sm border border-fg/18 bg-bg/40 px-4 text-[0.7rem] font-medium tracking-wide text-fg/85 sm:text-xs"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConsentChoice("agree");
                      const raw = (join.signup || MWR_SIGNUP_URL).trim();
                      const url =
                        !raw ||
                        raw === "about:blank" ||
                        !/^https?:\/\//i.test(raw)
                          ? MWR_SIGNUP_URL
                          : raw;
                      const a = document.createElement("a");
                      a.href = url;
                      a.target = "_blank";
                      a.rel = "noopener noreferrer";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }}
                    className="min-h-9 rounded-sm border border-fg/18 bg-bg/40 px-4 text-[0.7rem] font-medium tracking-wide text-fg/85 sm:text-xs"
                  >
                    공식 페이지 열기
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

function DualActionButton({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-sm border border-fg/18 bg-bg/30 px-3 py-3 text-center transition-colors duration-(--motion-fast) hover:border-fg/28 hover:bg-bg/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/40 min-[769px]:min-h-12"
    >
      <span className="text-[0.88rem] font-medium tracking-[0.08em] text-fg/90 min-[769px]:text-[0.7rem]">
        {label}
      </span>
      {hint ? (
        <span className="text-[0.58rem] tracking-wide text-fg-muted">{hint}</span>
      ) : null}
    </button>
  );
}

function SectionCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-fg/12 bg-bg-elevated/40 px-5 py-5 backdrop-blur-sm sm:px-6 sm:py-6">
      <p className="text-[0.65rem] font-medium tracking-[0.2em] text-fg-subtle">
        {number}
      </p>
      <h2 className="mt-1.5 font-display text-sm font-semibold tracking-[0.08em] text-fg sm:text-[0.9375rem]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
