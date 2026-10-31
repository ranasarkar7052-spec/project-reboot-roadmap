import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { CustomerBookingCard } from "@/components/booking/CustomerBookingCard";
import { ProviderBookingCard } from "@/components/booking/ProviderBookingCard";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { attachPartyNames, categoriesQuery, catName } from "@/lib/api";
import type { Booking } from "@/lib/db-types";

import type { Side } from "@/lib/portal";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One booking, opened from a notification. Access is decided by the database (RLS):
 * customers only get their own booking, providers only bookings assigned to them or
 * open requests in their approved categories. Anything else reads as "not found".
 */
export function BookingDetailsView({ bookingId, side }: { bookingId: string; side: Side }) {
  const { t, lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const { session } = useAuth();
  const uid = session?.user.id;
  const cats = useQuery(categoriesQuery);
  const validId = UUID_RE.test(bookingId);

  // Prefixes match the list pages' keys so the reused cards refresh this view after an action.
  const asCustomer = useQuery({
    queryKey: ["my-bookings", "detail", bookingId, uid],
    enabled: !!uid && validId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [row] = await attachPartyNames([data as Booking]);
      return row;
    },
  });
  // Re-read under the provider key so provider-card actions also refresh it.
  const isProviderView = !!asCustomer.data && asCustomer.data.customer_id !== uid;
  const asProvider = useQuery({
    queryKey: ["provider-bookings", "detail", bookingId, uid],
    enabled: isProviderView,
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [row] = await attachPartyNames([data as Booking]);
      return row;
    },
  });

  const back = isProviderView
    ? { to: "/provider/dashboard" as const, label: t("providerDash.title") }
    : { to: "/customer/bookings" as const, label: t("myBookings.title") };

  const providerRow = asProvider.data;
  const allowedProvider = !!providerRow && (providerRow.provider_id === uid || (providerRow.provider_id === null && providerRow.status === "requested"));
  const wrongSide = !!asCustomer.data && (side === "customer" ? isProviderView : !isProviderView);
  const notFound = !validId || wrongSide || asCustomer.data === null || (isProviderView && asProvider.isSuccess && !allowedProvider);
  const cat = (id: string) => cats.data?.find((c) => c.id === id);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <Link to={back.to} className={`btn-ghost mb-4 ${bn}`}>
          <ArrowLeft className="h-4 w-4" /> {back.label}
        </Link>
        {notFound ? (
          <EmptyState
            title={bnl ? "বুকিং পাওয়া যায়নি" : "Booking not available"}
            description={bnl ? "এই বুকিংটি নেই, অথবা এটি দেখার অনুমতি আপনার নেই।" : "This booking doesn't exist, or you don't have access to it."}
          />
        ) : asCustomer.isError || asProvider.isError ? (
          <ErrorState title={t("state.error")} description={t("state.errorDesc")} onRetry={() => { asCustomer.refetch(); asProvider.refetch(); }} />
        ) : !asCustomer.data || (isProviderView && !providerRow) ? (
          <LoadingState message={t("misc.loading")} />
        ) : isProviderView && providerRow ? (
          <ProviderBookingCard booking={providerRow} categoryName={catName(cat(providerRow.category_id), lang)} />
        ) : (
          <CustomerBookingCard
            booking={asCustomer.data}
            categoryName={catName(cat(asCustomer.data.category_id), lang)}
            estimate={cat(asCustomer.data.category_id)?.starting_price ?? null}
            showAddress
          />
        )}
      </div>
    </AppLayout>
  );
}
