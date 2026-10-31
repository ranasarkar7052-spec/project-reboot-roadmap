import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — LocalFix" },
      { name: "description", content: "Choose a new password for your LocalFix account." },
      { property: "og:title", content: "Set a new password — LocalFix" },
      { property: "og:description", content: "Choose a new password for your LocalFix account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppLayout>
      <ResetPasswordPage />
    </AppLayout>
  ),
});
