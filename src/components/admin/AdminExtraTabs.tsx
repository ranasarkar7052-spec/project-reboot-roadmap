import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/app-form";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/api";

/* ---------------- Re-verification details ---------------- */

const FIELD_LABELS: Record<string, [string, string]> = {
  full_name: ["Name", "নাম"],
  phone: ["Registered phone", "নিবন্ধিত ফোন"],
  village: ["Village", "গ্রাম"],
  contact_number: ["Contact number", "যোগাযোগ নম্বর"],
  category_ids: ["Services", "পরিষেবা"],
  service_areas: ["Service areas", "পরিষেবা এলাকা"],
  qualification_details: ["Qualification", "যোগ্যতা"],
  experience_years: ["Experience (years)", "অভিজ্ঞতা (বছর)"],
};

/**
 * Shows the previous values the database kept when an approved/rejected
 * provider changed a verification-sensitive field (provider_profiles.reverification_changes).
 */
export function ReverificationChanges({
  changes,
  current,
  categoryName,
}: {
  changes: unknown;
  current: Record<string, unknown>;
  categoryName: (id: string) => string;
}) {
  const { lang } = useI18n();
  const bnl = lang === "bn";
  const entries = changes && typeof changes === "object" ? Object.entries(changes as Record<string, unknown>) : [];
  if (entries.length === 0) return null;
  const show = (key: string, v: unknown) => {
    if (Array.isArray(v)) return v.map((x) => (key === "category_ids" ? categoryName(String(x)) : String(x))).join(", ") || "—";
    return v === null || v === undefined || v === "" ? "—" : String(v);
  };
  return (
    <div className={`mt-3 rounded-xl bg-warning-50 p-3 ring-1 ring-warning-200 ${bnl ? "font-bengali" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-warning-800">
        {bnl ? "পুনঃযাচাই — পরিবর্তিত তথ্য" : "Re-verification — changed details"}
      </p>
      <ul className="mt-2 space-y-1.5 text-xs text-neutral-700">
        {entries.map(([k, old]) => (
          <li key={k}>
            <span className="font-semibold">{FIELD_LABELS[k]?.[bnl ? 1 : 0] ?? k}:</span>{" "}
            <span className="text-neutral-500 line-through">{show(k, old)}</span> → <span className="font-semibold text-neutral-900">{show(k, current[k])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Customers ---------------- */

export function CustomersTab() {
  const { lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [profiles, roles, bookings] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, village, district, pin_code, created_at").order("created_at", { ascending: false }).limit(1000),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("bookings").select("customer_id, status").limit(5000),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      if (bookings.error) throw bookings.error;
      const roleMap = new Map<string, string[]>();
      for (const r of roles.data ?? []) roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
      const countMap = new Map<string, number>();
      for (const b of bookings.data ?? []) countMap.set(b.customer_id, (countMap.get(b.customer_id) ?? 0) + 1);
      return (profiles.data ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [], bookings: countMap.get(p.id) ?? 0 }));
    },
  });

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter((p) => !s || [p.full_name, p.phone, p.village, p.district].some((x) => x?.toLowerCase().includes(s)));
  }, [q.data, search]);

  if (q.isLoading) return <LoadingState message={bnl ? "লোড হচ্ছে..." : "Loading..."} />;
  if (q.isError) return <ErrorState title={bnl ? "ত্রুটি" : "Something went wrong"} description={(q.error as Error).message} onRetry={() => q.refetch()} />;

  return (
    <div className="space-y-4">
      <Input value={search} onChange={setSearch} placeholder={bnl ? "নাম, ফোন বা গ্রাম দিয়ে খুঁজুন" : "Search by name, phone or village"} />
      <p className={`text-sm text-neutral-500 ${bn}`}>{list.length} {bnl ? "জন ব্যবহারকারী" : "users"}</p>
      {list.length === 0 && <EmptyState title={bnl ? "কোনো ব্যবহারকারী নেই" : "No users found"} description="" />}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((p) => (
          <article key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-neutral-900">{p.full_name || "—"}</h3>
              <span className="text-xs text-neutral-400">{formatDate(p.created_at, lang)}</span>
            </div>
            <ul className={`mt-2 space-y-1 text-sm text-neutral-600 ${bn}`}>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-neutral-400" /> {p.phone || "—"}</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-neutral-400" /> {[p.village, p.district, p.pin_code].filter(Boolean).join(", ") || "—"}</li>
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {p.roles.map((r) => (
                <span key={r} className="rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">{r}</span>
              ))}
              <span className={`ml-auto text-xs text-neutral-500 ${bn}`}>{p.bookings} {bnl ? "বুকিং" : "bookings"}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Audit history ---------------- */

export function AuditTab() {
  const { lang } = useI18n();
  const bnl = lang === "bn";
  const q = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      const actorIds = [...new Set((data ?? []).map((a) => a.actor_id).filter(Boolean))] as string[];
      const names = new Map<string, string>();
      if (actorIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
        for (const p of ps ?? []) names.set(p.id, p.full_name);
      }
      return (data ?? []).map((a) => ({ ...a, actor_name: a.actor_id ? names.get(a.actor_id) ?? a.actor_id.slice(0, 8) : "system" }));
    },
  });

  if (q.isLoading) return <LoadingState message={bnl ? "লোড হচ্ছে..." : "Loading..."} />;
  if (q.isError) return <ErrorState title={bnl ? "ত্রুটি" : "Something went wrong"} description={(q.error as Error).message} onRetry={() => q.refetch()} />;
  if ((q.data ?? []).length === 0) return <EmptyState title={bnl ? "কোনো রেকর্ড নেই" : "No audit records yet"} description="" />;

  const summary = (a: { table_name: string; action: string; details: unknown }) => {
    const d = (a.details ?? {}) as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null };
    if (a.table_name === "provider_profiles") return `verification: ${d.old?.verification_status ?? "—"} → ${d.new?.verification_status ?? "—"}`;
    if (a.table_name === "bookings") return `status: ${d.old?.status ?? "—"} → ${d.new?.status ?? "—"}`;
    if (a.table_name === "user_roles") return `role ${(d.new ?? d.old)?.role ?? ""}`;
    if (a.table_name === "commission_policies") return `rate ${(d.new ?? d.old)?.rate_percentage ?? ""}% ${d.new?.is_active === false ? "(retired)" : ""}`;
    if (a.table_name === "commission_records") return `${d.new?.status ?? ""} ₹${d.new?.commission_amount ?? ""}`;
    if (a.table_name === "complaints") return `status: ${d.old?.status ?? "—"} → ${d.new?.status ?? "—"}`;
    if (a.table_name === "service_categories") return String((d.new ?? d.old)?.name_en ?? "");
    return "";
  };

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr><th className="px-4 py-3">{bnl ? "সময়" : "When"}</th><th className="px-4 py-3">{bnl ? "কে" : "Who"}</th><th className="px-4 py-3">{bnl ? "কী" : "What"}</th><th className="px-4 py-3">{bnl ? "বিবরণ" : "Details"}</th></tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((a) => (
            <tr key={a.id} className="border-t border-neutral-100">
              <td className="whitespace-nowrap px-4 py-2.5 text-neutral-500">{new Date(a.created_at).toLocaleString(bnl ? "bn-IN" : "en-IN")}</td>
              <td className="px-4 py-2.5 text-neutral-700">{a.actor_name}</td>
              <td className="px-4 py-2.5 text-neutral-700">{a.table_name} · {a.action}</td>
              <td className="px-4 py-2.5 text-neutral-600">{summary(a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
