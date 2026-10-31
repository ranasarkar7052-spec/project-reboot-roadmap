import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/provider")({
  beforeLoad: ({ location }) => requireRole("provider", "/provider/login", location.href),
  component: () => <Outlet />,
});
