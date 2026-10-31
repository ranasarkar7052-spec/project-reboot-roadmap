import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/provider-profile")({
  beforeLoad: () => { throw redirect({ to: "/provider/profile", replace: true }); },
});
