import { createFileRoute, redirect } from "@tanstack/react-router";

// Portal URL that reuses an existing screen.
export const Route = createFileRoute("/_authenticated/admin/providers")({
  beforeLoad: () => { throw redirect({ to: "/admin/dashboard", search: { tab: "providers" }, replace: true }); },
});
