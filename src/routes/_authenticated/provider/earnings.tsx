import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AlertMessage, PageHeader } from "@/components/ui/app-form";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, catName, formatDate } from "@/lib/api";
import { formatRupees } from "@/lib/data";
import type { Booking, CommissionRecord } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/provider/earnings")({
  head: () => ({
    meta: [
      { title: "My earnings — LocalFix provider" },
      { name: "description", content: "Completed jobs, agreed prices and LocalFix commission recorded for each job." },
      { property: "og:title", content: "My earnings — LocalFix provider" },
      { property: "og:description", content: "Completed jobs, agreed prices and commission records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EarningsPage,
});

function EarningsPage() {
  const { lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const L = (en: string, b: string) => (bnl ? b : en);
  const { session } = useAuth();
  const uid = session?.user.id;
  const cats = useQuery(categoriesQuery);

  const q = useQuery({
    queryKey: ["provider-earnings", uid],
    enabled: !!uid,
    queryFn: async () => {
      const [b, c] = await Promise.all([
        supabase.from("bookings").select("*").eq("provider_id", uid!).eq("status", "completed").order("updated_at", { ascending: false }),
        supabase.from("commission_records").select("*").order("created_at", { ascending: false }),
      ]);
      if (b.error) throw b.error;
      if (c.error) throw c.error;
      const recs = new Map((c.data as CommissionRecord[]).map((r) => [r.booking_id, r]));
      return (b.data as Booking[]).map((x) => ({ ...x, commission: recs.get(x.id) ?? null }));
    },
  });

  const rows = q.data ?? [];
  const totalAgreed = rows.reduce((s, r) => s + (r.agreed_amount ?? 0), 0);
  const totalCommission = rows.reduce((s, r) => s + (r.commission && r.commission.status !== "refunded" ? Number(r.commission.commission_amount) : 0), 0);

  return (
    <AppLayout wide>
      <PageHeader title={L("My earnings", "আমার আয়")} subtitle={L("Completed jobs and the commission recorded for each", "সম্পন্ন কাজ ও প্রতিটির কমিশন রেকর্ড")} />
      <div className="mb-6">
        <AlertMessage
          type="info"
          message={L(
            "Customers pay you directly (cash/manual). Commission shown here is what LocalFix has recorded as payable by you — it is not money collected online.",
            "গ্রাহক সরাসরি আপনাকে পরিশোধ করেন (নগদ/ম্যানুয়াল)। এখানে দেখানো কমিশন LocalFix-এর রেকর্ড অনুযায়ী আপনার দেয় — এটি অনলাইনে সংগৃহীত অর্থ নয়।",
          )}
        />
      </div>
      {q.isLoading && <LoadingState message={L("Loading...", "লোড হচ্ছে...")} />}
      {q.isError && <ErrorState title={L("Something went wrong", "ত্রুটি")} description={(q.error as Error).message} onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              [L("Completed jobs", "সম্পন্ন কাজ"), String(rows.length)],
              [L("Total agreed prices", "মোট চূড়ান্ত মূল্য"), formatRupees(totalAgreed)],
              [L("Commission recorded", "রেকর্ডকৃত কমিশন"), formatRupees(Math.round(totalCommission * 100) / 100)],
            ].map(([label, value]) => (
              <div key={label} className="card p-5">
                <p className={`text-xs font-semibold uppercase tracking-wide text-neutral-500 ${bn}`}>{label}</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
              </div>
            ))}
          </div>
          {rows.length === 0 ? (
            <EmptyState title={L("No completed jobs yet", "এখনও কোনো সম্পন্ন কাজ নেই")} description={L("Completed jobs will appear here.", "সম্পন্ন কাজ এখানে দেখা যাবে।")} />
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className={`w-full text-left text-sm ${bn}`}>
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">{L("Booking", "বুকিং")}</th>
                    <th className="px-4 py-3">{L("Service", "পরিষেবা")}</th>
                    <th className="px-4 py-3">{L("Date", "তারিখ")}</th>
                    <th className="px-4 py-3">{L("Agreed price", "চূড়ান্ত মূল্য")}</th>
                    <th className="px-4 py-3">{L("Commission", "কমিশন")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-neutral-100">
                      <td className="px-4 py-2.5 font-semibold text-neutral-800">{r.reference}</td>
                      <td className="px-4 py-2.5 text-neutral-600">{catName(cats.data?.find((c) => c.id === r.category_id), lang)}</td>
                      <td className="px-4 py-2.5 text-neutral-600">{formatDate(r.preferred_date, lang)}</td>
                      <td className="px-4 py-2.5 text-neutral-800">{r.agreed_amount != null ? formatRupees(r.agreed_amount) : "—"}</td>
                      <td className="px-4 py-2.5 text-neutral-800">
                        {r.commission
                          ? `${formatRupees(Number(r.commission.commission_amount))} (${Number(r.commission.commission_rate)}%)${r.commission.status !== "calculated" ? ` · ${r.commission.status}` : ""}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
