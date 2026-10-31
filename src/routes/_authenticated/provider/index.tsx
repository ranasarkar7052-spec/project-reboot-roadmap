import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/provider/")({
  beforeLoad: () => { throw redirect({ to: "/provider/dashboard" }); },
});
