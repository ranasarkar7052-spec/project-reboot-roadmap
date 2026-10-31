import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui/app-form";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { CustomerBookingCard } from "@/components/booking/CustomerBookingCard";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { attachPartyNames, categoriesQuery, catName } from "@/lib/api";
import type { Booking } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/customer/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — LocalFix" },
      { name: "description", content: "Track and manage your LocalFix service requests." },
      { property: "og:title", content: "My bookings — LocalFix" },
      { property: "og:description", content: "Track and manage your service requests." },
    ],
  }),
  component: MyBookingsPage,
});

type Row = Booking & { customer_name: string; provider_name: string };

function MyBookingsPage() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const { session } = useAuth();
  const cats = useQuery(categoriesQuery);
  const q = useQuery({
    queryKey: ["my-bookings", session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return attachPartyNames(data as Booking[]);
    },
  });

  return (
    <AppLayout wide>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title={t("myBookings.title")} subtitle={t("myBookings.subtitle")} />
        <Link to="/booking" className={`btn-primary mb-6 ${bn}`}>{t("myBookings.bookService")}</Link>
      </div>
      {q.isLoading && <LoadingState message={t("misc.loading")} />}
      {q.isError && <ErrorState title={t("state.error")} description={t("state.errorDesc")} onRetry={() => q.refetch()} />}
      {q.data && q.data.length === 0 && <EmptyState title={t("myBookings.empty")} description={t("myBookings.emptyDesc")} />}
      <div className="grid gap-4 lg:grid-cols-2">
        {q.data?.map((b) => (
          <CustomerBookingCard key={b.id} booking={b} categoryName={catName(cats.data?.find((c) => c.id === b.category_id), lang)} estimate={cats.data?.find((c) => c.id === b.category_id)?.starting_price ?? null} />
        ))}
      </div>
    </AppLayout>
  );
}
