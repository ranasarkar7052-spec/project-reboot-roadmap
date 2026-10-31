import { createFileRoute, Link } from "@tanstack/react-router";
import { NotificationsView } from "@/components/NotificationsView";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — LocalFix" },
      { name: "description", content: "Updates about your LocalFix bookings." },
      { property: "og:title", content: "Notifications — LocalFix" },
      { property: "og:description", content: "Updates about your bookings." },
    ],
  }),
  component: () => <NotificationsView side="customer" />,
});

