import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Bell, ClipboardList, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui/app-form";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { ProviderBookingCard } from "@/components/booking/ProviderBookingCard";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { attachPartyNames, categoriesQuery, catName } from "@/lib/api";
import type { Booking, BookingStatus } from "@/lib/db-types";
import { ProviderStatusCard, useMyProviderProfile } from "@/components/provider/ProviderForm";
import { PORTAL_NAV } from "@/components/PortalLayout";
import { QuickAccess, type QuickAccessItem } from "@/components/QuickAccess";

const QUICK_ICONS: Record<string, LucideIcon> = {
  "/provider/dashboard": ClipboardList,
  "/provider/earnings": Wallet,
  "/provider/profile": UserRound,
  "/provider/notifications": Bell,
};

export const Route = createFileRoute("/_authenticated/provider/dashboard")({
  head: () => ({
    meta: [
      { title: "Provider dashboard — LocalFix" },
      { name: "description", content: "Manage incoming booking requests and active jobs." },
      { property: "og:title", content: "Provider dashboard — LocalFix" },
      { property: "og:description", content: "Manage incoming booking requests and active jobs." },
    ],
  }),
  component: ProviderDashboardPage,
});

type Row = Booking & { customer_name: string; provider_name: string };

function ProviderDashboardPage() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  // The provider portal's own nav items, shown on the home page so they are
  // one click away instead of only inside the header menu.
  const quickItems: QuickAccessItem[] = PORTAL_NAV.provider.map((n) => ({
    to: n.to,
    label: lang === "bn" ? n.bn : n.en,
    icon: QUICK_ICONS[n.to] ?? ClipboardList,
  }));
  const { session } = useAuth();
  const uid = session?.user.id;
  const profileQ = useMyProviderProfile(uid);
  const cats = useQuery(categoriesQuery);
  const [tab, setTab] = useState<"incoming" | "active" | "history">("incoming");

  const approved = profileQ.data?.verification_status === "approved";
  const q = useQuery({
    queryKey: ["provider-bookings", uid],
    // Load for any provider status: a provider under re-verification must still
    // finish jobs already assigned to them (RLS only shows open requests to approved providers).
    enabled: !!uid && !!profileQ.data,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.from("bookings").select("*").order("preferred_date", { ascending: true });
      if (error) throw error;
      // RLS returns: my assigned bookings + open requests in my categories (+ my own customer bookings, filtered out here)
      const rows = (data as Booking[]).filter((b) => b.provider_id === uid || (b.provider_id === null && b.customer_id !== uid));
      return attachPartyNames(rows);
    },
  });

  if (profileQ.isLoading) return <AppLayout wide><LoadingState message={t("misc.loading")} /></AppLayout>;

  if (!profileQ.data) {
    return (
      <AppLayout wide>
        <PageHeader title={t("providerDash.title")} />
        <EmptyState title={t("providerDash.notProvider")} description={t("providerDash.notProviderDesc")} />
        <div className="mt-6 text-center"><Link to="/provider-register" className={`btn-primary ${bn}`}>{t("provider.apply")}</Link></div>
      </AppLayout>
    );
  }

  const groups: Record<typeof tab, BookingStatus[]> = {
    incoming: ["requested"],
    active: ["accepted", "on_the_way", "in_progress"],
    history: ["completed", "rejected", "cancelled"],
  };
  const list = (q.data ?? []).filter((b) => groups[tab].includes(b.status));

  return (
    <AppLayout wide>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title={t("providerDash.title")} subtitle={t("providerDash.subtitle")} />
        <Link to="/provider/profile" className={`btn-secondary mb-6 ${bn}`}><Pencil className="h-4 w-4" /> {t("providerDash.editProfile")}</Link>
      </div>

      <QuickAccess items={quickItems} className="mb-6" />

      {!approved && <div className="mb-6"><ProviderStatusCard profile={profileQ.data} /></div>}
      {!approved && (q.data ?? []).length === 0 ? null : (
        <>
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {(["incoming", "active", "history"] as const).map((k) => {
              const count = (q.data ?? []).filter((b) => groups[k].includes(b.status)).length;
              return (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${tab === k ? "bg-primary-600 text-white shadow-card" : "bg-white text-neutral-600 ring-1 ring-neutral-200"} ${bn}`}
                >
                  {t(`providerDash.${k}`)} ({count})
                </button>
              );
            })}
          </div>
          {q.isLoading && <LoadingState message={t("misc.loading")} />}
          {q.isError && <ErrorState title={t("state.error")} description={t("state.errorDesc")} onRetry={() => q.refetch()} />}
          {q.data && list.length === 0 && <EmptyState title={t("providerDash.noBookings")} description={t("providerDash.noBookingsDesc")} />}
          <div className="grid gap-4 lg:grid-cols-2">
            {list.map((b) => (
              <ProviderBookingCard key={b.id} booking={b} categoryName={catName(cats.data?.find((c) => c.id === b.category_id), lang)} />
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}

