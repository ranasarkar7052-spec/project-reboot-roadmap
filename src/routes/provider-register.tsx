import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock3 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AlertMessage, PageContainer, PageHeader } from "@/components/ui/app-form";
import { ProviderForm, ProviderStatusCard, useMyProviderProfile } from "@/components/provider/ProviderForm";
import { LoadingState } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/provider-register")({
  head: () => ({
    meta: [
      { title: "Become a provider — LocalFix" },
      { name: "description", content: "Apply to join LocalFix as a verified local service provider and receive bookings near you." },
      { property: "og:title", content: "Become a provider — LocalFix" },
      { property: "og:description", content: "Apply to join LocalFix as a verified local service provider." },
    ],
  }),
  component: () => (
    <AppLayout>
      <ProviderRegisterPage />
    </AppLayout>
  ),
});

function ProviderRegisterPage() {
  const { t, lang } = useI18n();
  const { session, loading } = useAuth();
  const qc = useQueryClient();
  const bn = lang === "bn" ? "font-bengali" : "";
  const { data: existing, isLoading } = useMyProviderProfile(session?.user.id);
  const [justSubmitted, setJustSubmitted] = useState(false);

  if (loading || (session && isLoading)) return <PageContainer><LoadingState message={t("misc.loading")} /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title={t("providerReg.title")} subtitle={t("providerReg.subtitle")} backTo="/" />

      {!session && (
        <div className="card space-y-4 p-6 text-center">
          <Clock3 className="mx-auto h-10 w-10 text-primary-500" />
          <p className={`text-neutral-600 ${bn}`}>{t("providerReg.needAccount")}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/register" className={`btn-primary ${bn}`}>{t("auth.signUp")}</Link>
            <Link to="/login" search={{ redirect: "/provider-register" }} className={`btn-secondary ${bn}`}>{t("auth.signIn")}</Link>
          </div>
        </div>
      )}

      {session && justSubmitted && (
        <AlertMessage type="success" title={t("providerReg.success")} message={t("providerReg.successDesc")} />
      )}

      {session && existing && !justSubmitted && (
        <div className="space-y-4">
          <p className={`text-sm text-neutral-500 ${bn}`}>{t("providerReg.alreadyRegistered")}</p>
          <ProviderStatusCard profile={existing} />
        </div>
      )}

      {session && !existing && !justSubmitted && (
        <ProviderForm
          onSaved={() => {
            setJustSubmitted(true);
            qc.invalidateQueries({ queryKey: ["my-provider-profile"] });
            window.scrollTo(0, 0);
          }}
        />
      )}
    </PageContainer>
  );
}
