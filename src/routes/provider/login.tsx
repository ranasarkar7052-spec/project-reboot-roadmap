import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { PortalLayout } from "@/components/PortalLayout";
import { LoginPage } from "@/components/auth/LoginPage";
import { AlertMessage } from "@/components/ui/app-form";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/provider/login")({
  validateSearch: z.object({ redirect: z.string().optional(), denied: z.coerce.string().optional() }),
  head: () => ({
    meta: [
      { title: "Provider sign in — LocalFix" },
      { name: "description", content: "Sign in to the LocalFix provider portal to manage jobs and earnings." },
      { property: "og:title", content: "Provider sign in — LocalFix" },
      { property: "og:description", content: "Manage your LocalFix jobs, availability and earnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProviderLogin,
});

function ProviderLogin() {
  const { lang } = useI18n();
  const { denied } = Route.useSearch();
  const bn = lang === "bn";
  return (
    <PortalLayout portal="provider">
      {denied && (
        <div className="mx-auto max-w-lg px-4 pt-6">
          <AlertMessage type="warning" message={bn ? "এই অ্যাকাউন্টটি প্রদানকারী নয়। নিচে আবেদন করুন।" : "This account is not a provider yet. Apply below to join."} />
        </div>
      )}
      <LoginPage
        defaultTo="/provider/dashboard"
        hideRegister
        title={bn ? "প্রদানকারী লগইন" : "Provider sign in"}
        subtitle={bn ? "আপনার কাজ, উপলব্ধতা ও আয় পরিচালনা করুন" : "Manage your jobs, availability and earnings"}
      />
      <p className={`pb-10 text-center text-sm text-neutral-500 ${bn ? "font-bengali" : ""}`}>
        {bn ? "নতুন প্রদানকারী?" : "New provider?"}{" "}
        <Link to="/provider-register" className="font-semibold text-primary-600">{bn ? "এখানে আবেদন করুন" : "Apply to join"}</Link>
      </p>
    </PortalLayout>
  );
}
