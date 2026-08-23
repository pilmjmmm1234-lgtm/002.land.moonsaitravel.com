"use client";

import { createFileRoute } from "@tanstack/react-router";
import { ContentWindow } from "@/components/content-window";
import { InfoNav } from "@/components/info-nav";
import { Page4BottomMenus } from "@/components/page4-bottom-menus";
import { Page4NoticeBoard } from "@/components/page4-notice-board";
import { SiteMenu } from "@/components/site-menu";

export const Route = createFileRoute("/info/")({
  component: InfoGuidePage,
  head: () => ({
    meta: [
      { title: "MWR Travel Membership Guide" },
      {
        name: "description",
        content:
          "MWR 여행 멤버십의 상품 구성, 조건, 혜택, 비용, 환불 및 해지 조건을 객관적으로 안내합니다.",
      },
    ],
  }),
});

function InfoGuidePage() {
  return (
    <main className="bg-bg text-fg max-[768px]:min-h-dvh max-[768px]:overflow-x-hidden max-[768px]:overflow-y-auto min-[769px]:h-dvh min-[769px]:max-h-dvh min-[769px]:overflow-x-hidden min-[769px]:overflow-y-auto">
      <SiteMenu variant="info" />

      <div className="box-border w-full px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,var(--grok-banner-h,2rem))] max-[768px]:flex max-[768px]:flex-col max-[768px]:gap-7 sm:px-4 min-[769px]:grid min-[769px]:h-full min-[769px]:min-h-0 min-[769px]:px-4 min-[769px]:pb-[max(0.35rem,env(safe-area-inset-bottom))] min-[769px]:pt-[max(2.4rem,var(--grok-banner-h,1.1rem))] min-[769px]:[grid-template-rows:auto_auto_minmax(0,1fr)_auto]">
        <header className="mb-1 shrink-0 text-center sm:mb-1.5">
          <h1 className="font-display px-2 text-[clamp(1.2rem,2.6vw,1.85rem)] font-semibold tracking-tight text-[var(--color-traveler)] break-keep min-[769px]:tracking-[0.08em]">
            MWR Travel Membership Guide
          </h1>
          <p className="mx-auto mt-3 max-w-2xl px-4 text-xs leading-relaxed text-fg/70 sm:text-sm">
            MWR은 여행 멤버십 서비스를 제공하는 회사입니다. 이 페이지는 MWR의 상품
            구성, 멤버십 조건, 이용 혜택, 비용, 환불 및 해지 조건 등을 객관적으로
            확인할 수 있도록 만든 안내 페이지입니다. 가입 전 반드시 MWR 공식 자료와
            약관을 직접 확인하시기 바랍니다. 본 페이지는 가입을 강요하거나 수익을
            보장하지 않으며, 최종 판단은 본인이 직접 하시기 바랍니다.
          </p>
          <div
            aria-hidden="true"
            className="mx-auto mt-2 h-px w-16 bg-linear-to-r from-transparent via-accent/70 to-transparent sm:mt-2.5 sm:w-24"
          />
        </header>

        <InfoNav />

        <div className="mx-auto flex min-h-0 w-full max-w-[min(100%,90rem)] flex-col justify-center gap-6 min-[769px]:gap-2 sm:min-[769px]:gap-2.5 md:min-[769px]:gap-3">
          <div className="album-frame w-full shrink-0 min-[769px]:h-[min(28vh,14.5rem)]">
            <div className="album-frame-inner h-full w-full max-[768px]:aspect-16/8">
              <ContentWindow
                windowId="Window_Main"
                aspectRatio=""
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="grid min-h-0 w-full grid-cols-1 items-stretch gap-4 min-[769px]:grid-cols-[16.5rem_minmax(0,1fr)] min-[769px]:gap-4">
            <div className="mx-auto w-full max-w-[16.5rem] min-[769px]:mx-0 min-[769px]:h-full min-[769px]:max-w-none">
              <div className="album-frame w-full min-[769px]:h-full" style={{ aspectRatio: "3 / 4" }}>
                <div className="album-frame-inner h-full w-full">
                  <ContentWindow
                    windowId="Window_01"
                    aspectRatio=""
                    className="h-full w-full"
                    autoplay={false}
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 min-w-0 w-full min-[769px]:h-full">
              <Page4NoticeBoard />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[min(100%,90rem)] shrink-0">
          <Page4BottomMenus compact />
        </div>
      </div>
    </main>
  );
}
