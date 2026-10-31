import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, User, Home } from "lucide-react";
import { AlertMessage, FormField, Input } from "@/components/ui/app-form";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ContactButtons } from "@/components/ContactButtons";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { canCancel, formatDate, providerNextStatus } from "@/lib/api";
import { formatRupees } from "@/lib/data";
import type { Booking, BookingStatus } from "@/lib/db-types";

export type ProviderBookingRow = Booking & { customer_name: string; provider_name: string };
type Row = ProviderBookingRow;

const nextLabel: Partial<Record<BookingStatus, string>> = {
  on_the_way: "providerDash.onTheWay",
  in_progress: "providerDash.inProgress",
  completed: "providerDash.complete",
};

export function ProviderBookingCard({ booking: b, categoryName }: { booking: Row; categoryName: string }) {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<null | "reject" | "cancel">(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(b.agreed_amount !== null ? String(b.agreed_amount) : "");

  const refresh = () => qc.invalidateQueries({ queryKey: ["provider-bookings"] });

  async function change(status: BookingStatus, why = "") {
    if ((status === "cancelled" || status === "rejected") && why.trim().length < 3) {
      setErr(t("booking.reasonRequired"));
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc("update_booking_status", { _booking_id: b.id, _status: status, _reason: why.trim().slice(0, 500) });
    setBusy(false);
    if (error) setErr(error.message);
    else { setMode(null); refresh(); }
  }

  async function saveAmount() {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 0 || n > 1000000) { setErr(t("providerDash.amountInvalid")); return; }
    setBusy(true);
    const { error } = await supabase.rpc("set_booking_amount", { _booking_id: b.id, _amount: n });
    setBusy(false);
    if (error) setErr(error.message);
    else refresh();
  }

  const next = providerNextStatus(b.status);
  const active = b.status === "accepted" || b.status === "on_the_way" || b.status === "in_progress";

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wider text-primary-600">{b.reference}</p>
          <h3 className={`mt-0.5 text-lg font-bold text-neutral-900 ${bn}`}>{categoryName}</h3>
        </div>
        <BookingStatusBadge status={b.status} />
      </div>
      <p className={`mt-2 text-sm text-neutral-600 ${bn}`}>{b.description}</p>
      <ul className={`mt-3 grid gap-1.5 text-sm text-neutral-600 sm:grid-cols-2 ${bn}`}>
        <li className="flex items-center gap-2"><User className="h-4 w-4 text-neutral-400" /> {b.customer_name || t("providerDash.customer")}</li>
        <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-neutral-400" /> {formatDate(b.preferred_date, lang)}</li>
        <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-neutral-400" /> {b.preferred_time}</li>
        <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-neutral-400" /> {b.village}</li>
        <li className="flex items-start gap-2 sm:col-span-2"><Home className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" /> {[b.address, b.landmark].filter(Boolean).join(", ")}
          {(b as { latitude?: number | null }).latitude != null && <a className="ml-2 font-medium text-primary-600" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${(b as { latitude?: number }).latitude},${(b as { longitude?: number }).longitude}`}>Map</a>}
        </li>
      </ul>
      {b.photo_url && (
        <a href={b.photo_url} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block text-sm font-medium text-primary-600 underline ${bn}`}>{t("providerDash.viewPhoto")}</a>
      )}

      {active && (
        <div className="mt-4 space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wide text-neutral-400 ${bn}`}>{t("providerDash.contactCustomer")}</p>
          <ContactButtons bookingId={b.id} reference={b.reference} status={b.status} preference={b.contact_preference} audience="customer" />
        </div>
      )}
      {b.status === "requested" && (
        <p className={`mt-3 text-xs text-neutral-500 ${bn}`}>{t("providerDash.contactUnavailableDesc")}</p>
      )}

      {active && (
        <div className="mt-4 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
          <FormField label={t("providerDash.setAmount")}>
            <div className="flex gap-2">
              <div className="flex-1"><Input value={amount} onChange={setAmount} type="number" placeholder="500" /></div>
              <button disabled={busy} onClick={saveAmount} className={`btn-secondary px-4 py-2 text-sm ${bn}`}>{t("providerDash.saveAmount")}</button>
            </div>
          </FormField>
          <p className={`mt-1 text-xs text-neutral-500 ${bn}`}>
            {b.agreed_amount !== null
              ? b.amount_confirmed
                ? `✓ ${t("myBookings.amountAgreed")}: ${formatRupees(b.agreed_amount)}`
                : `${t("providerDash.awaitingConfirm")}: ${formatRupees(b.agreed_amount)}`
              : t("providerDash.amountHint")}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
        {b.status === "requested" && (
          <>
            <button disabled={busy} onClick={() => change("accepted")} className={`btn-primary px-4 py-2.5 text-sm ${bn}`}>{t("providerDash.accept")}</button>
            {b.provider_id && <button disabled={busy} onClick={() => setMode("reject")} className={`btn-secondary px-4 py-2.5 text-sm ${bn}`}>{t("providerDash.reject")}</button>}
          </>
        )}
        {next && (
          <button
            disabled={busy || (next === "completed" && !b.amount_confirmed)}
            onClick={() => change(next)}
            className={`btn-primary px-4 py-2.5 text-sm ${bn}`}
            title={next === "completed" && !b.amount_confirmed ? t("providerDash.needAmountFirst") : undefined}
          >
            {t(nextLabel[next] ?? "")}
          </button>
        )}
        {b.status !== "requested" && canCancel(b.status) && (
          <button disabled={busy} onClick={() => setMode("cancel")} className={`btn-ghost text-error-600 ${bn}`}>{t("providerDash.cancel")}</button>
        )}
      </div>
      {next === "completed" && !b.amount_confirmed && (
        <p className={`mt-2 text-xs text-warning-700 ${bn}`}>{t("providerDash.needAmountFirst")}</p>
      )}

      {mode && (
        <div className="mt-3 space-y-3">
          <FormField label={mode === "reject" ? t("providerDash.rejectReason") : t("providerDash.cancelReason")} required>
            <Input value={reason} onChange={setReason} placeholder={t("providerDash.cancelReasonHint")} />
          </FormField>
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => change(mode === "reject" ? "rejected" : "cancelled", reason)} className={`btn-danger px-4 py-2.5 text-sm ${bn}`}>
              {mode === "reject" ? t("providerDash.reject") : t("providerDash.cancel")}
            </button>
            <button onClick={() => setMode(null)} className={`btn-ghost ${bn}`}>{t("admin.cancel")}</button>
          </div>
        </div>
      )}
      {err && <div className="mt-3"><AlertMessage type="error" message={err} onClose={() => setErr(null)} /></div>}
    </article>
  );
}
