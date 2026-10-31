import { createFileRoute, Link } from "@tanstack/react-router";
import { NotificationsView } from "@/components/NotificationsView";

export const Route = createFileRoute("/_authenticated/provider/notifications")({
  head: () => ({
    meta: [
      { title: "Provider notifications — LocalFix" },
      { name: "description", content: "Job updates for LocalFix service providers." },
      { property: "og:title", content: "Provider notifications — LocalFix" },
      { property: "og:description", content: "Job updates for service providers." },
    ],
  }),
  component: () => <NotificationsView side="provider" />,
});

