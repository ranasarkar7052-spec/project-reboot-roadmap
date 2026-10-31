import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, catName, formatDate } from "@/lib/api";
import { formatRupees } from "@/lib/data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/_authenticated/admin/accounts/$userId")({
  head: () => ({
    meta: [
      { title: "Account details — LocalFix admin" },
      { name: "description", content: "Customer or provider account details and booking history for LocalFix administrators." },
      { property: "og:title", content: "Account details — LocalFix admin" },
      { property: "og:description", content: "Account details and booking history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { from?: string } => (typeof s.from === "string" ? { from: s.from } : {}),
  component: AccountPage,
});

/** One customer/provider account, identified by its database ID. Protected by the admin route guard and admin-only RLS. */
function AccountPage() {
  const { userId } = Route.useParams();
  const { from } = Route.useSearch();
  const { t, lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const L = (en: string, b: string) => (bnl ? b : en);
  const cats = useQuery(categoriesQuery);
  const valid = UUID_RE.test(userId);

  const q = useQuery({
    queryKey: ["admin-account", userId],
    enabled: valid,
    queryFn: async () => {
      const [profile, roles, provider, bookings] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("provider_profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("bookings").select("*").or(`customer_id.eq.${userId},provider_id.eq.${userId}`).order("created_at", { ascending: false }).limit(500),
      ]);
      for (const r of [profile, roles, provider, bookings]) if (r.error) throw r.error;
      return { profile: profile.data, roles: (roles.data ?? []).map((r) => r.role), provider: provider.data, bookings: bookings.data ?? [] };
    },
  });

  const back = from
    ? { to: "/admin/dashboard" as const, search: { tab: "bookings" as const, booking: from }, label: L("Back to booking", "বুকিংয়ে ফিরুন") }
    : { to: "/admin/dashboard" as const, search: { tab: "customers" as const }, label: L("Back to admin", "অ্যাডমিনে ফিরুন") };

  const row = (label: string, value: ReactNode) => (
    <div className="flex gap-2 text-sm">
      <dt className={`w-40 shrink-0 text-neutral-500 ${bn}`}>{label}</dt>
      <dd className="min-w-0 break-words text-neutral-800">{value || "—"}</dd>
    </div>
  );

  const d = q.data;
  const p = d?.profile;
  const pp = d?.provider;

  return (
    <AppLayout wide>
      <Link to={back.to} search={back.search} className={`btn-ghost mb-4 ${bn}`}>
        <ArrowLeft className="h-4 w-4" /> {back.label}
      </Link>
      {!valid || (q.isSuccess && !p) ? (
        <EmptyState title={L("Account not found", "অ্যাকাউন্ট পাওয়া যায়নি")} description="" />
      ) : q.isError ? (
        <ErrorState title={t("state.error")} description={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !d || !p ? (
        <LoadingState message={t("misc.loading")} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5">
              <div className="mb-3 flex items-center gap-3">
                {pp?.photo_url && <img src={pp.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />}
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">{p.full_name || "—"}</h1>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {d.roles.map((r) => <span key={r} className="rounded-lg bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">{r}</span>)}
                  </div>
                </div>
              </div>
              <dl className="space-y-1.5">
                {row(L("Account ID", "অ্যাকাউন্ট আইডি"), <span className="text-xs">{p.id}</span>)}
                {row(L("Registered phone", "নিবন্ধিত ফোন"), p.phone)}
                {row(L("Address", "ঠিকানা"), [p.address_line, p.landmark, p.village, p.post_office, p.district, p.state, p.pin_code].filter(Boolean).join(", "))}
                {row(L("Joined", "যোগদান"), formatDate(p.created_at, lang))}
              </dl>
            </section>
            {pp && (
              <section className="card p-5">
                <h2 className={`mb-3 font-bold text-neutral-900 ${bn}`}>{L("Provider details", "কর্মীর বিবরণ")}</h2>
                <dl className="space-y-1.5">
                  {row(L("Verification", "যাচাই"), t(`admin.providerStatus.${pp.verification_status}`))}
                  {pp.verification_note && row(L("Last decision note", "শেষ সিদ্ধান্তের নোট"), pp.verification_note)}
                  {row(L("Work contact", "কাজের যোগাযোগ"), pp.contact_number)}
                  {row(L("Services", "পরিষেবা"), pp.category_ids.map((id) => catName(cats.data?.find((c) => c.id === id), lang)).join(", "))}
                  {row(L("Service area", "পরিষেবা এলাকা"), pp.service_areas.join(", "))}
                  {row(L("Experience", "অভিজ্ঞতা"), `${pp.experience_years} ${t("browse.experience")}`)}
                  {row(L("Qualification", "যোগ্যতা"), pp.qualification_details)}
                  {row(L("Available", "উপলব্ধ"), pp.is_available ? L("Yes", "হ্যাঁ") : L("No", "না"))}
                </dl>
              </section>
            )}
          </div>

          <section className="card overflow-x-auto p-0">
            <h2 className={`px-4 pt-4 font-bold text-neutral-900 ${bn}`}>{L("Booking history", "বুকিংয়ের ইতিহাস")} ({d.bookings.length})</h2>
            {d.bookings.length === 0 ? (
              <p className={`p-4 text-sm text-neutral-500 ${bn}`}>{L("No bookings yet.", "এখনও কোনো বুকিং নেই।")}</p>
            ) : (
              <table className="mt-2 w-full min-w-[640px] text-left text-sm">
                <thead className={`bg-neutral-50 text-xs uppercase text-neutral-500 ${bn}`}>
                  <tr>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">{t("providerDash.service")}</th>
                    <th className="px-4 py-3">{L("As", "ভূমিকা")}</th>
                    <th className="px-4 py-3">{t("providerDash.date")}</th>
                    <th className="px-4 py-3">₹</th>
                    <th className="px-4 py-3">{t("admin.filterStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {d.bookings.map((b) => (
                    <tr key={b.id} className={b.id === from ? "bg-primary-50/40" : ""}>
                      <td className="px-4 py-3">
                        <Link to="/admin/dashboard" search={{ tab: "bookings", booking: b.id }} className="font-semibold text-primary-700 hover:underline">{b.reference}</Link>
                      </td>
                      <td className={`px-4 py-3 ${bn}`}>{catName(cats.data?.find((c) => c.id === b.category_id), lang)}</td>
                      <td className={`px-4 py-3 ${bn}`}>{b.customer_id === userId ? L("Customer", "গ্রাহক") : L("Provider", "কর্মী")}</td>
                      <td className="px-4 py-3">{formatDate(b.preferred_date, lang)}</td>
                      <td className="px-4 py-3">{b.agreed_amount !== null ? formatRupees(b.agreed_amount) : "—"}</td>
                      <td className="px-4 py-3"><BookingStatusBadge status={b.status as never} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </AppLayout>
  );
}
