import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/provider-dashboard")({
  beforeLoad: () => { throw redirect({ to: "/provider/dashboard", replace: true }); },
});
