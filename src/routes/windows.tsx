import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/windows")({
  beforeLoad: () => {
    throw redirect({ to: "/info" });
  },
});
