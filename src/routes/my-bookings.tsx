import { createFileRoute, redirect } from "@tanstack/react-router";

// Old URL kept working after the move to the customer portal.
export const Route = createFileRoute("/my-bookings")({
  beforeLoad: () => { throw redirect({ to: "/customer/bookings", replace: true }); },
});
