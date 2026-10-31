import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AlertMessage, PageContainer, PageHeader } from "@/components/ui/app-form";
import { LoadingState } from "@/components/States";
import { ProviderForm, ProviderStatusCard, useMyProviderProfile } from "@/components/provider/ProviderForm";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ProfileDetailsForm } from "@/components/ProfileDetailsForm";

export const Route = createFileRoute("/_authenticated/provider/profile")({
  head: () => ({
    meta: [
      { title: "My provider profile — LocalFix" },
      { name: "description", content: "Update your services, areas and availability." },
      { property: "og:title", content: "My provider profile — LocalFix" },
      { property: "og:description", content: "Update your services, areas and availability." },
    ],
  }),
  component: ProviderProfilePage,
});

function ProviderProfilePage() {
  const { t } = useI18n();
  const { session } = useAuth();
  const qc = useQueryClient();
  const q = useMyProviderProfile(session?.user.id);
  const [saved, setSaved] = useState(false);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={t("providerDash.editProfile")} backTo="/provider/dashboard" />
        {q.isLoading && <LoadingState message={t("misc.loading")} />}
        {!q.isLoading && !q.data && (
          <div className="text-center"><Link to="/provider-register" className="btn-primary">{t("provider.apply")}</Link></div>
        )}
        {q.data && (
          <div className="space-y-5">
            <ProviderStatusCard profile={q.data} />
            {saved && <AlertMessage type="success" message={t("misc.saved")} onClose={() => setSaved(false)} />}
            {/* Name / registered phone / address live on the shared profile; changing name, phone or village triggers re-verification in the database. */}
            <ProfileDetailsForm isProvider onSaved={() => qc.invalidateQueries({ queryKey: ["my-provider-profile"] })} />
            <ProviderForm
              key={q.data.updated_at}
              existing={q.data}
              onSaved={() => { setSaved(true); qc.invalidateQueries({ queryKey: ["my-provider-profile"] }); window.scrollTo(0, 0); }}
            />
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
