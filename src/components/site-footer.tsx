import { CONTACT_MAILTO } from "@/content/contact";

type SiteFooterProps = {
  className?: string;
};

/**
 * Contact footer for Join page (page 5) only.
 */
export function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer
      className={`w-full border-t border-fg/8 bg-bg/80 px-4 py-6 backdrop-blur-sm sm:py-8 ${className}`}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <ul className="min-w-0 space-y-2 rounded-sm border border-fg/12 bg-bg/40 px-3.5 py-3.5 text-left text-xs leading-relaxed text-fg/85 sm:px-4 sm:py-4 sm:text-[0.8125rem]">
          <li>
            ※ Moon's AI Travel은 개인 운영 정보공유 페이지이며, MWR Life와
            무관합니다.
          </li>
          <li>
            ※ 본 페이지는 회원제 정보 안내 페이지입니다. MWR Life 운영과 무관하며,
            수익 보장·회원 모집 활동을 하지 않습니다.
          </li>
          <li>
            ※ 본 페이지를 통한 행동의 결과에 대한 책임은 본인에게 있습니다.
          </li>
        </ul>

        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <a
            href={CONTACT_MAILTO}
            className="caption-bar-shimmer inline-flex min-h-8 items-center justify-center rounded-sm border border-fg/18 bg-bg/45 px-3.5 text-[0.7rem] font-medium tracking-wide text-fg/90 transition-colors duration-(--motion-fast) hover:border-fg/32 hover:bg-bg/60 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg/40"
          >
            이메일 문의하기
          </a>
        </div>
      </div>
    </footer>
  );
}
