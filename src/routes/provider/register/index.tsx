import { createFileRoute, redirect } from "@tanstack/react-router";

// Portal URL that reuses an existing screen.
export const Route = createFileRoute("/provider/register/")({
  beforeLoad: () => { throw redirect({ to: "/provider-register", replace: true }); },
});
