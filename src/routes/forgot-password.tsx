import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — LocalFix" },
      { name: "description", content: "Get a link to set a new password for your LocalFix account." },
      { property: "og:title", content: "Reset password — LocalFix" },
      { property: "og:description", content: "Get a link to set a new password for your LocalFix account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppLayout>
      <ForgotPasswordPage />
    </AppLayout>
  ),
});
