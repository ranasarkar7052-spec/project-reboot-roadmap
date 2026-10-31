import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/customer")({
  beforeLoad: ({ location }) => requireRole("customer", "/login", location.href),
  component: () => <Outlet />,
});
