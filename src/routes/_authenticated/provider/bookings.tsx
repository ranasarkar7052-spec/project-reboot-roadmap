import { createFileRoute, redirect } from "@tanstack/react-router";

// Portal URL that reuses an existing screen.
export const Route = createFileRoute("/_authenticated/provider/bookings")({
  beforeLoad: () => { throw redirect({ to: "/provider/dashboard", replace: true }); },
});
