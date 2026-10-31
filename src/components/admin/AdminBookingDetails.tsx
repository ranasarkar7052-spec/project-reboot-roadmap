import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { LoadingState } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, catName, formatDate } from "@/lib/api";
import { formatRupees } from "@/lib/data";
import type { Booking } from "@/lib/db-types";

/** Admin-only view of one booking with its customer, provider and status history (read via admin RLS). */
export function AdminBookingDetails({ booking: b, categoryName, estimate }: { booking: Booking; categoryName: string; estimate: number | null }) {
  const { t, lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const cats = useQuery(categoriesQuery);
  const q = useQuery({
    queryKey: ["admin-booking-detail", b.id],
    queryFn: async () => {
      const ids = [b.customer_id, b.provider_id].filter(Boolean) as string[];
      const profiles = await supabase
        .from("profiles")
        .select("id, full_name, phone, village, address_line, post_office, pin_code, district, state, landmark")
        .in("id", ids);
      if (profiles.error) throw profiles.error;
      const history = await supabase.from("booking_status_history").select("id, status, reason, created_at").eq("booking_id", b.id).order("created_at");
      if (history.error) throw history.error;
      let provider = null as null | { photo_url: string; category_ids: string[]; service_areas: string[]; verification_status: string; contact_number: string };
      if (b.provider_id) {
        const pp = await supabase.from("provider_profiles").select("photo_url, category_ids, service_areas, verification_status, contact_number").eq("id", b.provider_id).maybeSingle();
        if (pp.error) throw pp.error;
        provider = pp.data;
      }
      return {
        customer: profiles.data?.find((p) => p.id === b.customer_id) ?? null,
        providerProfile: b.provider_id ? profiles.data?.find((p) => p.id === b.provider_id) ?? null : null,
        provider,
        history: history.data ?? [],
      };
    },
  });

  const L = (en: string, bnText: string) => (bnl ? bnText : en);
  const row = (label: string, value: ReactNode) => (
    <div className="flex gap-2 text-sm">
      <dt className={`w-36 shrink-0 text-neutral-500 ${bn}`}>{label}</dt>
      <dd className="min-w-0 break-words text-neutral-800">{value || "—"}</dd>
    </div>
  );
  const account = (id: string, name: string) => (
    <Link to="/admin/accounts/$userId" params={{ userId: id }} search={{ from: b.id }} className="font-semibold text-primary-700 hover:underline">
      {name || "—"}
    </Link>
  );

  if (q.isLoading) return <LoadingState message={t("misc.loading")} />;
  if (q.isError) return <p className="text-sm text-error-600">{(q.error as Error).message}</p>;
  const d = q.data!;
  const c = d.customer;
  const p = d.providerProfile;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card p-4">
        <h4 className={`mb-2 font-bold text-neutral-900 ${bn}`}>{L("Booking details", "বুকিংয়ের বিবরণ")}</h4>
        <dl className="space-y-1.5">
          {row(L("Booking ID", "বুকিং আইডি"), <><span className="font-semibold">{b.reference}</span><span className="block text-xs text-neutral-400">{b.id}</span></>)}
          {row(L("Service", "পরিষেবা"), categoryName)}
          {row(L("Date & time", "তারিখ ও সময়"), `${formatDate(b.preferred_date, lang)} · ${b.preferred_time}`)}
          {row(L("Status", "অবস্থা"), <BookingStatusBadge status={b.status} />)}
          {row(L("Service address", "পরিষেবার ঠিকানা"), [b.address, b.landmark, b.village].filter(Boolean).join(", "))}
          {(b as { latitude?: number | null }).latitude != null && row(L("Map location", "মানচিত্রে অবস্থান"), `${(b as { latitude?: number }).latitude}, ${(b as { longitude?: number }).longitude}`)}
          {row(L("Problem details", "সমস্যার বিবরণ"), b.description)}
          {b.photo_url && row(L("Photo", "ছবি"), <a href={b.photo_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">{L("View", "দেখুন")}</a>)}
          {row(L("Estimated price", "আনুমানিক মূল্য"), estimate ? `${L("From", "শুরু")} ${formatRupees(estimate)}` : "")}
          {row(L("Final agreed price", "চূড়ান্ত মূল্য"), b.agreed_amount !== null ? `${formatRupees(b.agreed_amount)} ${b.amount_confirmed ? L("(confirmed by customer)", "(গ্রাহক নিশ্চিত করেছেন)") : L("(awaiting customer)", "(গ্রাহকের অপেক্ষায়)")}` : "")}
          {b.cancel_reason && row(L("Reason", "কারণ"), b.cancel_reason)}
          {row(L("Created", "তৈরি"), new Date(b.created_at).toLocaleString(bnl ? "bn-IN" : "en-IN"))}
        </dl>
        <h5 className={`mt-4 mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500 ${bn}`}>{L("Status history", "অবস্থার ইতিহাস")}</h5>
        {d.history.length === 0 ? (
          <p className="text-sm text-neutral-400">—</p>
        ) : (
          <ol className="space-y-1 text-sm text-neutral-700">
            {d.history.map((h) => (
              <li key={h.id}>
                <span className={bn}>{t(`myBookings.status.${h.status}`)}</span>
                <span className="text-xs text-neutral-400"> · {new Date(h.created_at).toLocaleString(bnl ? "bn-IN" : "en-IN")}</span>
                {h.reason && <span className="block text-xs text-neutral-500">{h.reason}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card p-4">
        <h4 className={`mb-2 font-bold text-neutral-900 ${bn}`}>{L("Customer", "গ্রাহক")}</h4>
        <dl className="space-y-1.5">
          {row(L("Name", "নাম"), account(b.customer_id, c?.full_name ?? ""))}
          {row(L("Account ID", "অ্যাকাউন্ট আইডি"), <span className="text-xs">{b.customer_id}</span>)}
          {row(L("Registered phone", "নিবন্ধিত ফোন"), c?.phone)}
          {row(L("Saved address", "সংরক্ষিত ঠিকানা"), c ? [c.address_line, c.landmark, c.village, c.post_office, c.district, c.state, c.pin_code].filter(Boolean).join(", ") : "")}
        </dl>
      </section>

      <section className="card p-4">
        <h4 className={`mb-2 font-bold text-neutral-900 ${bn}`}>{L("Service provider", "কর্মী")}</h4>
        {!b.provider_id ? (
          <p className={`text-sm font-semibold text-neutral-500 ${bn}`}>{L("Not Assigned", "নিযুক্ত হয়নি")}</p>
        ) : (
          <>
            {d.provider?.photo_url && <img src={d.provider.photo_url} alt="" className="mb-2 h-16 w-16 rounded-full object-cover" />}
            <dl className="space-y-1.5">
              {row(L("Name", "নাম"), account(b.provider_id, p?.full_name ?? ""))}
              {row(L("Account ID", "অ্যাকাউন্ট আইডি"), <span className="text-xs">{b.provider_id}</span>)}
              {row(L("Registered phone", "নিবন্ধিত ফোন"), p?.phone)}
              {row(L("Work contact", "কাজের যোগাযোগ"), d.provider?.contact_number)}
              {row(L("Services", "পরিষেবা"), (d.provider?.category_ids ?? []).map((id) => catName(cats.data?.find((x) => x.id === id), lang)).join(", "))}
              {row(L("Service area", "পরিষেবা এলাকা"), (d.provider?.service_areas ?? []).join(", "))}
              {row(L("Verification", "যাচাই"), d.provider ? t(`admin.providerStatus.${d.provider.verification_status}`) : "")}
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
