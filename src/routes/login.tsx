import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppLayout } from "@/components/AppLayout";
import { LoginPage } from "@/components/auth/LoginPage";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — LocalFix" },
      { name: "description", content: "Sign in to LocalFix to book and manage local repair services." },
      { property: "og:title", content: "Sign in — LocalFix" },
      { property: "og:description", content: "Sign in to book and manage local repair services." },
    ],
  }),
  component: () => (
    <AppLayout>
      <LoginPage />
    </AppLayout>
  ),
});
