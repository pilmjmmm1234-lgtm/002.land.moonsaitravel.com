import { createFileRoute } from "@tanstack/react-router";
import { JoinDesk } from "@/components/join-desk";

export const Route = createFileRoute("/info/membership")({
  component: () => <JoinDesk mode="membership" />,
  head: () => ({
    meta: [
      { title: "멤버십 안내 — MWR Travel Membership Guide" },
      {
        name: "description",
        content: "MWR 여행 멤버십 구성과 이용 방식을 객관적으로 안내합니다.",
      },
    ],
  }),
});
