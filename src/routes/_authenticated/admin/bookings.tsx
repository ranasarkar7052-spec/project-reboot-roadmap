import { createFileRoute, redirect } from "@tanstack/react-router";

// Portal URL that reuses an existing screen.
export const Route = createFileRoute("/_authenticated/admin/bookings")({
  beforeLoad: () => { throw redirect({ to: "/admin/dashboard", search: { tab: "bookings" }, replace: true }); },
});
