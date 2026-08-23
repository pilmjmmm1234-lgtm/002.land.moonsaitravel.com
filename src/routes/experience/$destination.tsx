import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout for /experience/:destination and nested /:story slideshow.
 */
export const Route = createFileRoute("/experience/$destination")({
  component: () => <Outlet />,
});
