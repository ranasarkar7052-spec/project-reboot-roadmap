import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { RegisterPage } from "@/components/auth/RegisterPage";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — LocalFix" },
      { name: "description", content: "Create a free LocalFix account to book trusted local repair workers." },
      { property: "og:title", content: "Create account — LocalFix" },
      { property: "og:description", content: "Create a free account to book trusted local repair workers." },
    ],
  }),
  component: () => (
    <AppLayout>
      <RegisterPage />
    </AppLayout>
  ),
});
