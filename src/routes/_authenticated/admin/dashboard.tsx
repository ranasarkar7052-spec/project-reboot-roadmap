import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Users, ClipboardList, BarChart3, Percent, MessageSquareWarning, Tags, Phone, MapPin, UserRound, History } from "lucide-react";
import { CustomersTab, AuditTab, ReverificationChanges } from "@/components/admin/AdminExtraTabs";
import { AdminBookingDetails } from "@/components/admin/AdminBookingDetails";
import { AppLayout } from "@/components/AppLayout";
import { AlertMessage, FormField, Input, PageHeader, TextArea } from "@/components/ui/app-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { attachPartyNames, canCancel, categoriesQuery, catName, formatDate } from "@/lib/api";
import { formatRupees } from "@/lib/data";
import type { Booking, BookingStatus, CommissionRecord, Complaint, ComplaintStatus } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — LocalFix" },
      { name: "description", content: "Approve providers, review bookings, reports and commission." },
      { property: "og:title", content: "Admin dashboard — LocalFix" },
      { property: "og:description", content: "Approve providers, review bookings, reports and commission." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { tab?: Tab; booking?: string } => ({
    ...(TABS.includes(s.tab as Tab) ? { tab: s.tab as Tab } : {}),
    ...(typeof s.booking === "string" ? { booking: s.booking } : {}),
  }),
  component: AdminPage,
});

type Tab = "providers" | "customers" | "bookings" | "reports" | "commission" | "complaints" | "categories" | "audit";
const TABS: Tab[] = ["providers", "customers", "bookings", "reports", "commission", "complaints", "categories", "audit"];
const selectCls = "w-full rounded-xl border-0 bg-white px-3 py-3 text-sm text-neutral-800 shadow-card ring-1 ring-inset ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500";

function AdminPage() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const { hasRole, loading, refreshProfile } = useAuth();
  const { tab: searchTab, booking: searchBooking } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(searchTab ?? "providers");
  useEffect(() => { if (searchTab) setTab(searchTab); }, [searchTab]);

  if (loading) return <AppLayout wide><LoadingState message={t("misc.loading")} /></AppLayout>;

  if (!hasRole("admin")) {
    return (
      <AppLayout wide>
        <div className="mx-auto max-w-md py-10 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-warning-500" />
          <h1 className={`mt-4 text-xl font-bold text-neutral-900 ${bn}`}>{t("admin.accessDenied")}</h1>
          <p className={`mt-2 text-sm text-neutral-500 ${bn}`}>{t("admin.accessDeniedDesc")}</p>
        </div>
      </AppLayout>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "providers", label: t("admin.pendingProviders"), icon: Users },
    { id: "customers", label: lang === "bn" ? "ব্যবহারকারী" : "Customers", icon: UserRound },
    { id: "bookings", label: t("admin.allBookings"), icon: ClipboardList },
    { id: "reports", label: t("admin.reports"), icon: BarChart3 },
    { id: "commission", label: t("admin.commission"), icon: Percent },
    { id: "complaints", label: t("admin.complaints"), icon: MessageSquareWarning },
    { id: "categories", label: t("admin.categories"), icon: Tags },
    { id: "audit", label: lang === "bn" ? "অডিট ইতিহাস" : "Audit history", icon: History },
  ];

  return (
    <AppLayout wide>
      <PageHeader title={t("admin.title")} subtitle={t("admin.subtitle")} />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${tab === id ? "bg-primary-600 text-white shadow-card" : "bg-white text-neutral-600 ring-1 ring-neutral-200"} ${bn}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {tab === "providers" && <ProvidersTab />}
      {tab === "bookings" && <BookingsTab focus={searchBooking} />}
      {tab === "reports" && <ReportsTab />}
      {tab === "commission" && <CommissionTab />}
      {tab === "complaints" && <ComplaintsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "customers" && <CustomersTab />}
      {tab === "audit" && <AuditTab />}
    </AppLayout>
  );
}

/* ---------------- Providers ---------------- */
function useAdminProviders() {
  return useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_providers");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function ProvidersTab() {
  const { t, lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const q = useAdminProviders();
  const cats = useQuery(categoriesQuery);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function review(id: string, approve: boolean, note: string) {
    setBusy(true); setErr(null); setOk(null);
    const { error } = await supabase.rpc("admin_review_provider", { _provider_id: id, _approve: approve, _note: note.trim() });
    setBusy(false);
    if (error) { setErr(error.message); return false; }
    setOk(approve ? (bnl ? "কর্মী অনুমোদিত হয়েছে।" : "Provider approved.") : (bnl ? "কর্মী প্রত্যাখ্যাত হয়েছে। কারণ সংরক্ষিত হয়েছে।" : "Provider rejected. The reason has been saved."));
    qc.invalidateQueries({ queryKey: ["admin-providers"] }); qc.invalidateQueries({ queryKey: ["approved-providers"] });
    return true;
  }

  async function confirmReject() {
    if (!rejectFor) return;
    if (reason.trim().length < 3) { setReasonErr(bnl ? "প্রত্যাখ্যানের কারণ লিখুন (কমপক্ষে ৩ অক্ষর)।" : "Please enter a reason for rejection (at least 3 characters)."); return; }
    if (await review(rejectFor.id, false, reason)) { setRejectFor(null); setReason(""); setReasonErr(null); }
    else setRejectFor(null);
  }

  if (q.isLoading) return <LoadingState message={t("misc.loading")} />;
  if (q.isError) return <ErrorState title={t("state.error")} description={t("state.errorDesc")} onRetry={() => q.refetch()} />;
  const isReverify = (p: { reverification_changes: unknown }) =>
    !!p.reverification_changes && typeof p.reverification_changes === "object" && Object.keys(p.reverification_changes as object).length > 0;
  const list = (q.data ?? [])
    .filter((p) => p.verification_status === filter)
    .sort((a, b) => Number(isReverify(b)) - Number(isReverify(a)));
  const catLabel = (id: string) => catName((cats.data ?? []).find((c) => c.id === id), lang);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === f ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200"} ${bn}`}>
            {t(`admin.providerStatus.${f}`)} ({(q.data ?? []).filter((p) => p.verification_status === f).length})
          </button>
        ))}
      </div>
      {err && <AlertMessage type="error" message={err} onClose={() => setErr(null)} />}
      {ok && <AlertMessage type="success" message={ok} onClose={() => setOk(null)} />}
      {list.length === 0 && <EmptyState title={t("admin.noPending")} description={t("admin.noPendingDesc")} />}
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((p) => (
          <article key={p.id} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-neutral-900">{p.full_name || "—"}</h3>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-neutral-400">{formatDate(p.created_at, lang)}</span>
                {isReverify(p) && (
                  <span className={`rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-semibold text-warning-800 ${bn}`}>
                    {lang === "bn" ? "পুনঃযাচাই" : "Re-verification"}
                  </span>
                )}
              </div>
            </div>
            <ul className={`mt-2 space-y-1 text-sm text-neutral-600 ${bn}`}>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-neutral-400" /> {p.contact_number || p.phone}</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-neutral-400" /> {p.service_areas.join(", ")}</li>
              <li>{(cats.data ?? []).filter((c) => p.category_ids.includes(c.id)).map((c) => catName(c, lang)).join(", ")}</li>
              <li>{p.experience_years} {t("browse.experience")}</li>
              {p.qualification_details && <li className="text-neutral-500">{p.qualification_details}</li>}
              <li className="text-xs text-success-700">✓ {t("admin.consentRecorded")} {p.consent_at ? formatDate(p.consent_at, lang) : ""}</li>
            </ul>
            {p.verification_note && <p className="mt-2 rounded-lg bg-neutral-100 p-2 text-xs text-neutral-600">{p.verification_note}</p>}
            <ReverificationChanges changes={p.reverification_changes} current={p as unknown as Record<string, unknown>} categoryName={catLabel} />
            <div className="mt-4 space-y-2">
              {p.verification_status !== "approved" && (
                <Input value={notes[p.id] ?? ""} onChange={(v) => setNotes({ ...notes, [p.id]: v })} placeholder={t("admin.approveNote")} />
              )}
              <div className="flex gap-2">
                {p.verification_status !== "approved" && <button disabled={busy} onClick={() => review(p.id, true, notes[p.id] ?? "")} className={`btn-primary px-4 py-2.5 text-sm ${bn}`}>{t("admin.approve")}</button>}
                {p.verification_status !== "rejected" && (
                  <button disabled={busy} onClick={() => { setRejectFor({ id: p.id, name: p.full_name }); setReason(""); setReasonErr(null); }} className={`btn-secondary px-4 py-2.5 text-sm ${bn}`}>
                    {t("admin.reject")}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o && !busy) setRejectFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={bn}>{bnl ? "কর্মীকে প্রত্যাখ্যান করুন" : "Reject provider"}{rejectFor?.name ? ` — ${rejectFor.name}` : ""}</DialogTitle>
            <DialogDescription className={bn}>
              {bnl ? "কারণটি সংরক্ষিত হবে এবং কর্মীকে জানানো হবে।" : "The reason is saved and sent to the provider."}
            </DialogDescription>
          </DialogHeader>
          <FormField label={bnl ? "প্রত্যাখ্যানের কারণ" : "Reason for Rejection"} required error={reasonErr ?? undefined}>
            <TextArea value={reason} onChange={(v) => { setReason(v); if (reasonErr) setReasonErr(null); }} rows={4} />
          </FormField>
          <DialogFooter className="gap-2">
            <button type="button" disabled={busy} onClick={() => setRejectFor(null)} className={`btn-ghost ${bn}`}>{t("admin.cancel")}</button>
            <button type="button" disabled={busy || reason.trim().length < 3} onClick={confirmReject} className={`btn-danger px-4 py-2.5 text-sm ${bn}`}>
              {bnl ? "প্রত্যাখ্যান নিশ্চিত করুন" : "Confirm Rejection"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Bookings ---------------- */
type BRow = Booking & { customer_name: string; provider_name: string };
function useAdminBookings() {
  return useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async (): Promise<BRow[]> => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return attachPartyNames(data as Booking[]);
    },
  });
}

function BookingsTab({ focus }: { focus?: string }) {
  const { t, lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const q = useAdminBookings();
  const cats = useQuery(categoriesQuery);
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [service, setService] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState<string | null>(null);
  // Booking whose full details are expanded; opened automatically when returning from an account page.
  const [open, setOpen] = useState<string | null>(focus ?? null);
  useEffect(() => {
    if (focus && q.data) document.getElementById(`booking-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus, q.data]);

  const providers = useMemo(() => [...new Set((q.data ?? []).map((b) => b.provider_name).filter(Boolean))].sort(), [q.data]);
  const list = (q.data ?? []).filter(
    (b) => (!date || b.preferred_date === date) && (!service || b.category_id === service) && (!provider || b.provider_name === provider) && (!status || b.status === status),
  );

  async function adminCancel(id: string) {
    const reason = window.prompt(t("myBookings.cancelReason"));
    if (!reason || reason.trim().length < 3) return;
    const { error } = await supabase.rpc("update_booking_status", { _booking_id: id, _status: "cancelled", _reason: reason.trim().slice(0, 500) });
    if (error) setErr(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-bookings"] });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={`text-xs font-semibold text-neutral-600 ${bn}`}>{t("admin.filterDate")}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${selectCls} mt-1`} />
        </label>
        <label className={`text-xs font-semibold text-neutral-600 ${bn}`}>{t("admin.filterService")}
          <select value={service} onChange={(e) => setService(e.target.value)} className={`${selectCls} mt-1`}>
            <option value="">{t("browse.allCategories")}</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{catName(c, lang)}</option>)}
          </select>
        </label>
        <label className={`text-xs font-semibold text-neutral-600 ${bn}`}>{t("admin.filterProvider")}
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className={`${selectCls} mt-1`}>
            <option value="">—</option>
            {providers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className={`text-xs font-semibold text-neutral-600 ${bn}`}>{t("admin.filterStatus")}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${selectCls} mt-1`}>
            <option value="">—</option>
            {(["requested", "accepted", "on_the_way", "in_progress", "completed", "rejected", "cancelled"] as BookingStatus[]).map((s) => (
              <option key={s} value={s}>{t(`myBookings.status.${s}`)}</option>
            ))}
          </select>
        </label>
      </div>
      {err && <AlertMessage type="error" message={err} onClose={() => setErr(null)} />}
      {q.isLoading && <LoadingState message={t("misc.loading")} />}
      {q.data && list.length === 0 && <EmptyState title={t("myBookings.empty")} description={t("admin.noBookingsMatch")} />}
      {list.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={`bg-neutral-50 text-xs uppercase text-neutral-500 ${bn}`}>
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">{t("providerDash.service")}</th>
                <th className="px-4 py-3">{t("providerDash.customer")}</th>
                <th className="px-4 py-3">{t("booking.summaryProvider")}</th>
                <th className="px-4 py-3">{t("providerDash.date")}</th>
                <th className="px-4 py-3">₹</th>
                <th className="px-4 py-3">{t("admin.filterStatus")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {list.map((b) => {
                const cat = cats.data?.find((c) => c.id === b.category_id);
                const isOpen = open === b.id;
                return (
                  <Fragment key={b.id}>
                    <tr id={`booking-${b.id}`} className={isOpen ? "bg-primary-50/40" : ""}>
                      <td className="px-4 py-3 font-semibold text-primary-700">{b.reference}</td>
                      <td className={`px-4 py-3 ${bn}`}>{catName(cat, lang)}</td>
                      <td className="px-4 py-3">
                        <Link to="/admin/accounts/$userId" params={{ userId: b.customer_id }} search={{ from: b.id }} className="font-medium text-primary-700 hover:underline">{b.customer_name || "—"}</Link>
                      </td>
                      <td className="px-4 py-3">
                        {b.provider_id ? (
                          <Link to="/admin/accounts/$userId" params={{ userId: b.provider_id }} search={{ from: b.id }} className="font-medium text-primary-700 hover:underline">{b.provider_name || "—"}</Link>
                        ) : (
                          <span className={`text-neutral-400 ${bn}`}>{bnl ? "নিযুক্ত হয়নি" : "Not Assigned"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{formatDate(b.preferred_date, lang)}</td>
                      <td className="px-4 py-3">{b.agreed_amount !== null ? formatRupees(b.agreed_amount) : "—"}</td>
                      <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                      <td className="space-x-3 whitespace-nowrap px-4 py-3">
                        <button onClick={() => setOpen(isOpen ? null : b.id)} className={`text-xs font-semibold text-primary-600 hover:underline ${bn}`}>
                          {isOpen ? (bnl ? "বন্ধ করুন" : "Hide") : (bnl ? "বিস্তারিত" : "Details")}
                        </button>
                        {canCancel(b.status) && <button onClick={() => adminCancel(b.id)} className={`text-xs font-semibold text-error-600 hover:underline ${bn}`}>{t("myBookings.cancel")}</button>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="bg-neutral-50 px-4 py-4">
                          <AdminBookingDetails booking={b} categoryName={catName(cat, lang)} estimate={cat?.starting_price ?? null} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Commission data ---------------- */
function useCommissionRecords() {
  return useQuery({
    queryKey: ["admin-commission"],
    queryFn: async () => {
      const { data, error } = await supabase.from("commission_records").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CommissionRecord[];
    },
  });
}

/* ---------------- Reports ---------------- */
function Stat({ label, value }: { label: string; value: string | number }) {
  const { lang } = useI18n();
  return (
    <div className="card p-5">
      <p className={`text-xs font-semibold uppercase tracking-wide text-neutral-500 ${lang === "bn" ? "font-bengali" : ""}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function ReportsTab() {
  const { t } = useI18n();
  const bookings = useAdminBookings();
  const providers = useAdminProviders();
  const commission = useCommissionRecords();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expenses, setExpenses] = useState("0");

  const inRange = (d: string) => (!from || d.slice(0, 10) >= from) && (!to || d.slice(0, 10) <= to);
  const b = (bookings.data ?? []).filter((x) => inRange(x.created_at));
  const c = (commission.data ?? []).filter((x) => inRange(x.created_at) && x.status !== "refunded");
  const gross = c.reduce((s, x) => s + Number(x.commission_amount), 0);
  const exp = Math.max(0, Number(expenses) || 0);

  if (bookings.isLoading || providers.isLoading || commission.isLoading) return <LoadingState message={t("misc.loading")} />;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label={t("admin.fromDate")}><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls} /></FormField>
        <FormField label={t("admin.toDate")}><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls} /></FormField>
        <FormField label={t("admin.expenses") + " (₹)"}><Input value={expenses} onChange={setExpenses} type="number" /></FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t("admin.totalBookings")} value={b.length} />
        <Stat label={t("admin.completedBookings")} value={b.filter((x) => x.status === "completed").length} />
        <Stat label={t("admin.cancelledBookings")} value={b.filter((x) => x.status === "cancelled" || x.status === "rejected").length} />
        <Stat label={t("admin.totalProviders")} value={providers.data?.length ?? 0} />
        <Stat label={t("admin.verifiedProviders")} value={(providers.data ?? []).filter((p) => p.verification_status === "approved").length} />
        <Stat label={t("admin.grossCommission")} value={formatRupees(Math.round(gross))} />
        <Stat label={t("admin.expenses")} value={formatRupees(exp)} />
        <Stat label={t("admin.netProfit")} value={formatRupees(Math.round(gross - exp))} />
      </div>
    </div>
  );
}

/* ---------------- Commission ---------------- */
function CommissionTab() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const qc = useQueryClient();
  const records = useCommissionRecords();
  const bookings = useAdminBookings();
  const policy = useQuery({
    queryKey: ["admin-policy"],
    queryFn: async () => {
      const { data } = await supabase.from("commission_policies").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1);
      return data?.[0] ?? null;
    },
  });
  const [rate, setRate] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMsg, setAdminMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  async function addAdmin() {
    const email = adminEmail.trim();
    if (!email.includes("@")) { setAdminMsg({ type: "error", text: "Enter a valid email" }); return; }
    const { error } = await supabase.rpc("admin_grant_admin", { _email: email });
    if (error) setAdminMsg({ type: "error", text: error.message });
    else { setAdminMsg({ type: "success", text: `${email} is now an admin` }); setAdminEmail(""); }
  }

  async function savePolicy() {
    const r = Number(rate);
    if (!Number.isFinite(r) || r < 0 || r > 50) { setMsg({ type: "error", text: t("admin.rateInvalid") }); return; }
    const { error } = await supabase.rpc("admin_set_commission_rate", { _rate: r });
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: t("admin.policySaved") }); setRate(""); qc.invalidateQueries({ queryKey: ["admin-policy"] }); }
  }

  async function adjust(rec: CommissionRecord, refund: boolean) {
    const note = window.prompt(t("admin.adjustmentNote"));
    if (note === null) return;
    let amount = Number(rec.commission_amount);
    if (!refund) {
      const v = window.prompt(t("admin.newCommissionAmount"), String(amount));
      if (v === null) return;
      amount = Number(v);
      if (!Number.isFinite(amount) || amount < 0) return;
    }
    const { error } = await supabase
      .from("commission_records")
      .update({ status: refund ? "refunded" : "adjusted", commission_amount: refund ? 0 : amount, adjustment_note: note.slice(0, 500) })
      .eq("id", rec.id);
    if (error) setMsg({ type: "error", text: error.message });
    else qc.invalidateQueries({ queryKey: ["admin-commission"] });
  }

  const refOf = (id: string) => bookings.data?.find((b) => b.id === id)?.reference ?? "—";

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className={`font-bold text-neutral-900 ${bn}`}>{t("admin.setCommissionPolicy")}</h3>
        <p className={`mt-1 text-sm text-neutral-500 ${bn}`}>{t("admin.commissionRate")}: <strong>{policy.data ? `${policy.data.rate_percentage}%` : "—"}</strong></p>
        <div className="mt-3 flex max-w-sm gap-2">
          <div className="flex-1"><Input value={rate} onChange={setRate} type="number" placeholder="10" /></div>
          <button onClick={savePolicy} className={`btn-primary px-4 py-2.5 text-sm ${bn}`}>{t("admin.savePolicy")}</button>
        </div>
        <p className={`mt-2 text-xs text-neutral-500 ${bn}`}>{t("admin.commissionHint")}</p>
        {msg && <div className="mt-3"><AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg(null)} /></div>}
      </div>

      <div className="card p-5">
        <h3 className={`font-bold text-neutral-900 ${bn}`}>{bn ? "নতুন অ্যাডমিন যোগ করুন" : "Add another admin"}</h3>
        <p className={`mt-1 text-sm text-neutral-500 ${bn}`}>{bn ? "যে অ্যাকাউন্টটি ইতিমধ্যে সাইন আপ করেছে তার ইমেল দিন।" : "Enter the email of an account that has already signed up."}</p>
        <div className="mt-3 flex max-w-sm gap-2">
          <div className="flex-1"><Input value={adminEmail} onChange={setAdminEmail} type="email" placeholder="name@example.com" /></div>
          <button onClick={addAdmin} className={`btn-primary px-4 py-2.5 text-sm ${bn}`}>{bn ? "অ্যাডমিন করুন" : "Make admin"}</button>
        </div>
        {adminMsg && <div className="mt-3"><AlertMessage type={adminMsg.type} message={adminMsg.text} onClose={() => setAdminMsg(null)} /></div>}
      </div>

      {records.isLoading && <LoadingState message={t("misc.loading")} />}
      {records.data?.length === 0 && <EmptyState title={t("admin.noCommissionRecords")} description={t("admin.commissionHint")} />}
      {(records.data?.length ?? 0) > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={`bg-neutral-50 text-xs uppercase text-neutral-500 ${bn}`}>
              <tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">₹</th><th className="px-4 py-3">%</th><th className="px-4 py-3">{t("admin.commission")}</th><th className="px-4 py-3">{t("admin.filterStatus")}</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {records.data?.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-primary-700">{refOf(r.booking_id)}</td>
                  <td className="px-4 py-3">{formatRupees(r.agreed_amount)}</td>
                  <td className="px-4 py-3">{r.commission_rate}%</td>
                  <td className="px-4 py-3 font-semibold">₹{Number(r.commission_amount).toFixed(2)}</td>
                  <td className={`px-4 py-3 ${bn}`}>{t(`admin.commissionStatus.${r.status}`)}{r.adjustment_note && <span className="block text-xs text-neutral-400">{r.adjustment_note}</span>}</td>
                  <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                    {r.status !== "refunded" && (
                      <>
                        <button onClick={() => adjust(r, false)} className={`text-xs font-semibold text-primary-600 hover:underline ${bn}`}>{t("admin.adjustCommission")}</button>
                        <button onClick={() => adjust(r, true)} className={`text-xs font-semibold text-error-600 hover:underline ${bn}`}>{t("admin.refundCommission")}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Complaints ---------------- */
function ComplaintsTab() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const qc = useQueryClient();
  const bookings = useAdminBookings();
  const q = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Complaint[];
    },
  });
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function setStatus(c: Complaint, status: ComplaintStatus) {
    await supabase.from("complaints").update({ status, resolution_note: (notes[c.id] ?? c.resolution_note).slice(0, 1000) }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["admin-complaints"] });
  }

  if (q.isLoading) return <LoadingState message={t("misc.loading")} />;
  if (q.data?.length === 0) return <EmptyState title={t("admin.noComplaints")} description={t("admin.noComplaintsDesc")} />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {q.data?.map((c) => (
        <article key={c.id} className="card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-primary-600">{bookings.data?.find((b) => b.id === c.booking_id)?.reference ?? ""}</p>
              <h3 className="font-bold text-neutral-900">{c.subject}</h3>
            </div>
            <span className={`rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 ${bn}`}>{t(`admin.complaintStatus.${c.status}`)}</span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">{c.description}</p>
          <div className="mt-3 space-y-2">
            <Input value={notes[c.id] ?? c.resolution_note} onChange={(v) => setNotes({ ...notes, [c.id]: v })} placeholder={t("admin.resolveComplaint")} />
            <div className="flex flex-wrap gap-2">
              {(["investigating", "resolved", "dismissed"] as ComplaintStatus[]).map((s) => (
                <button key={s} disabled={c.status === s} onClick={() => setStatus(c, s)} className={`btn-secondary px-3 py-2 text-xs ${bn}`}>{t(`admin.complaintStatus.${s}`)}</button>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------- Categories ---------------- */
function CategoriesTab() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("service_categories").select("*").order("sort_order")).data ?? [],
  });
  const [form, setForm] = useState({ slug: "", name_en: "", name_bn: "", desc_en: "", desc_bn: "", starting_price: "" });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["categories"] }); };

  async function add() {
    const slug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(slug) || !form.name_en.trim() || !form.name_bn.trim()) { setErr(t("admin.categoryInvalid")); return; }
    const price = Math.max(0, Math.round(Number(form.starting_price) || 0));
    const { error } = await supabase.from("service_categories").insert({
      slug, name_en: form.name_en.trim().slice(0, 80), name_bn: form.name_bn.trim().slice(0, 80),
      desc_en: form.desc_en.trim().slice(0, 300), desc_bn: form.desc_bn.trim().slice(0, 300),
      starting_price: price, sort_order: (q.data?.length ?? 0) + 1,
    });
    if (error) setErr(error.message);
    else { setForm({ slug: "", name_en: "", name_bn: "", desc_en: "", desc_bn: "", starting_price: "" }); refresh(); }
  }

  async function editPrice(id: string, current: number) {
    const v = window.prompt(lang === "bn" ? "নতুন শুরুর দাম (₹)" : "New starting price (₹)", String(current));
    if (v === null) return;
    const price = Math.round(Number(v));
    if (!Number.isFinite(price) || price < 0) { setErr(t("admin.categoryInvalid")); return; }
    const { error } = await supabase.from("service_categories").update({ starting_price: price }).eq("id", id);
    if (error) setErr(error.message); else refresh();
  }

  async function toggle(id: string, is_active: boolean) {
    await supabase.from("service_categories").update({ is_active }).eq("id", id);
    refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        {q.data?.map((c) => (
          <div key={c.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className={`font-semibold text-neutral-900 ${bn}`}>{catName(c, lang)}</p>
              <p className="text-xs text-neutral-500">{c.slug} · {formatRupees(c.starting_price)}{" "}
                <button type="button" className="font-semibold text-primary-600 underline" onClick={() => editPrice(c.id, c.starting_price)}>
                  {lang === "bn" ? "দাম বদলান" : "Edit price"}
                </button>
              </p>
            </div>
            <button onClick={() => toggle(c.id, !c.is_active)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${c.is_active ? "bg-success-50 text-success-700" : "bg-neutral-100 text-neutral-500"} ${bn}`}>
              {c.is_active ? t("admin.active") : t("admin.inactive")}
            </button>
          </div>
        ))}
      </div>
      <div className="card space-y-3 p-5">
        <h3 className={`font-bold text-neutral-900 ${bn}`}>{t("admin.addCategory")}</h3>
        <FormField label={t("admin.categorySlug")} required><Input value={form.slug} onChange={set("slug")} placeholder="carpenter" /></FormField>
        <FormField label={t("admin.categoryNameEn")} required><Input value={form.name_en} onChange={set("name_en")} /></FormField>
        <FormField label={t("admin.categoryNameBn")} required><Input value={form.name_bn} onChange={set("name_bn")} /></FormField>
        <FormField label={t("admin.categoryDescEn")}><Input value={form.desc_en} onChange={set("desc_en")} /></FormField>
        <FormField label={t("admin.categoryDescBn")}><Input value={form.desc_bn} onChange={set("desc_bn")} /></FormField>
        <FormField label={t("admin.categoryStartingPrice")}><Input value={form.starting_price} onChange={set("starting_price")} type="number" /></FormField>
        {err && <AlertMessage type="error" message={err} onClose={() => setErr(null)} />}
        <button onClick={add} className={`btn-primary w-full ${bn}`}>{t("admin.save")}</button>
      </div>
    </div>
  );
}
