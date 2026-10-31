import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PortalLayout } from "@/components/PortalLayout";
import { LoginPage } from "@/components/auth/LoginPage";
import { AlertMessage } from "@/components/ui/app-form";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/login")({
  validateSearch: z.object({ redirect: z.string().optional(), denied: z.coerce.string().optional() }),
  head: () => ({
    meta: [
      { title: "Admin sign in — LocalFix" },
      { name: "description", content: "Restricted sign-in for LocalFix administrators." },
      { property: "og:title", content: "Admin sign in — LocalFix" },
      { property: "og:description", content: "Restricted sign-in for LocalFix administrators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const { lang } = useI18n();
  const { denied } = Route.useSearch();
  const bn = lang === "bn";
  return (
    <PortalLayout portal="admin">
      {denied && (
        <div className="mx-auto max-w-lg px-4 pt-6">
          <AlertMessage type="error" message={bn ? "এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।" : "This account does not have administrator access."} />
        </div>
      )}
      <LoginPage
        defaultTo="/admin/dashboard"
        hideRegister
        title={bn ? "অ্যাডমিন লগইন" : "Admin sign in"}
        subtitle={bn ? "শুধুমাত্র অনুমোদিত প্রশাসকদের জন্য" : "Authorized administrators only"}
      />
    </PortalLayout>
  );
}
