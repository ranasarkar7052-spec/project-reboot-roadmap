import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ location }) => requireRole("admin", "/admin/login", location.href),
  component: () => <Outlet />,
});
