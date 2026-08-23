import { createFileRoute } from "@tanstack/react-router";
import { JoinDesk } from "@/components/join-desk";

export const Route = createFileRoute("/info/faq")({
  component: () => <JoinDesk mode="faq" />,
  head: () => ({
    meta: [
      { title: "가입 전 확인사항 — MWR Travel Membership Guide" },
      {
        name: "description",
        content:
          "가입 전 비용, 조건, 환불 및 해지 사항을 공식 자료에서 확인하세요.",
      },
    ],
  }),
});
