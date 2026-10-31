import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, User, Flag, Star, Home } from "lucide-react";
import { AlertMessage, FormField, Input, TextArea } from "@/components/ui/app-form";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ContactButtons } from "@/components/ContactButtons";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { canCancel, formatDate } from "@/lib/api";
import { formatRupees } from "@/lib/data";
import type { Booking } from "@/lib/db-types";

export type CustomerBookingRow = Booking & { customer_name: string; provider_name: string };
type Row = CustomerBookingRow;


/** Star rating for a completed booking; one review per booking (enforced by the database). */
function ReviewBox({ booking: b }: { booking: Row }) {
  const { lang } = useI18n();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const { session } = useAuth();
  const qc = useQueryClient();
  const reviews = useQuery({
    queryKey: ["my-reviews", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("booking_id, rating, comment").eq("customer_id", session!.user.id);
      if (error) throw error;
      return data ?? [];
    },
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!reviews.data || !b.provider_id) return null;
  const existing = reviews.data.find((r) => r.booking_id === b.id);
  if (existing) {
    return (
      <p className={`mt-3 inline-flex items-center gap-1 text-sm text-neutral-600 ${bn}`}>
        <Star className="h-4 w-4 fill-warning-500 text-warning-500" /> {bnl ? "আপনার রেটিং" : "Your rating"}: {existing.rating}/5
      </p>
    );
  }
  async function submit() {
    if (rating < 1) { setErr(bnl ? "একটি রেটিং বেছে নিন" : "Choose a rating"); return; }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: b.id, customer_id: session!.user.id, provider_id: b.provider_id!, rating, comment: comment.trim().slice(0, 1000),
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-reviews"] });
    qc.invalidateQueries({ queryKey: ["provider-ratings"] });
  }
  return (
    <div className="mt-4 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
      <p className={`text-sm font-semibold text-neutral-800 ${bn}`}>{bnl ? "কাজটি কেমন ছিল?" : "How was the service?"}</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label={bnl ? "রেটিং" : "Rating"}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}`} onClick={() => setRating(n)} className="p-1">
            <Star className={`h-6 w-6 ${n <= rating ? "fill-warning-500 text-warning-500" : "text-neutral-300"}`} />
          </button>
        ))}
      </div>
      <div className="mt-2"><Input value={comment} onChange={setComment} placeholder={bnl ? "মন্তব্য (ঐচ্ছিক)" : "Comment (optional)"} /></div>
      {err && <p className={`mt-2 text-xs text-error-600 ${bn}`}>{err}</p>}
      <button disabled={busy} onClick={submit} className={`btn-primary mt-3 px-4 py-2.5 text-sm ${bn}`}>{bnl ? "রিভিউ জমা দিন" : "Submit review"}</button>
    </div>
  );
}

export function CustomerBookingCard({ booking: b, categoryName, estimate, showAddress = false }: { booking: Row; categoryName: string; estimate: number | null; showAddress?: boolean }) {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const { session } = useAuth();
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["my-bookings"] });

  async function cancel() {
    if (reason.trim().length < 3) {
      setMsg({ type: "error", text: t("booking.reasonRequired") });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("update_booking_status", { _booking_id: b.id, _status: "cancelled", _reason: reason.trim().slice(0, 500) });
    setBusy(false);
    if (error) setMsg({ type: "error", text: error.message });
    else { setCancelOpen(false); refresh(); }
  }

  async function confirmAmount(accept: boolean) {
    setBusy(true);
    const { error } = await supabase.rpc("confirm_booking_amount", { _booking_id: b.id, _accept: accept });
    setBusy(false);
    if (error) setMsg({ type: "error", text: error.message });
    else refresh();
  }

  async function submitComplaint() {
    if (subject.trim().length < 3 || complaintText.trim().length < 5) {
      setMsg({ type: "error", text: t("complaint.tooShort") });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("complaints").insert({
      booking_id: b.id,
      complainant_id: session!.user.id,
      subject: subject.trim().slice(0, 150),
      description: complaintText.trim().slice(0, 2000),
    });
    setBusy(false);
    if (error) setMsg({ type: "error", text: error.message });
    else { setComplaintOpen(false); setSubject(""); setComplaintText(""); setMsg({ type: "success", text: t("complaint.sent") }); }
  }

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
        <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-neutral-400" /> {formatDate(b.preferred_date, lang)}</li>
        <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-neutral-400" /> {b.preferred_time}</li>
        <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-neutral-400" /> {b.village}</li>
        <li className="flex items-center gap-2"><User className="h-4 w-4 text-neutral-400" /> {b.provider_name || t("booking.anyProvider")}</li>
        {showAddress && (
          <li className="flex items-start gap-2 sm:col-span-2"><Home className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" /> {[b.address, b.landmark].filter(Boolean).join(", ")}</li>
        )}
      </ul>

      {b.cancel_reason && (b.status === "cancelled" || b.status === "rejected") && (
        <p className={`mt-3 rounded-lg bg-neutral-100 p-2.5 text-xs text-neutral-600 ${bn}`}>{b.cancel_reason}</p>
      )}

      {estimate !== null && (
        <p className={`mt-3 text-xs text-neutral-500 ${bn}`}>{lang === "bn" ? "আনুমানিক মূল্য" : "Estimated price"}: {t("cat.from")} {formatRupees(estimate)}{b.agreed_amount === null ? (lang === "bn" ? " · চূড়ান্ত মূল্য কর্মী প্রস্তাব করবেন" : " · final price will be proposed by the provider") : ""}</p>
      )}
      {b.agreed_amount !== null && !b.amount_confirmed && ["accepted", "on_the_way", "in_progress"].includes(b.status) && (
        <div className="mt-4 rounded-xl bg-accent-50 p-4 ring-1 ring-accent-200">
          <p className={`text-sm font-semibold text-neutral-800 ${bn}`}>{t("myBookings.amountProposed")}: {formatRupees(b.agreed_amount)}</p>
          <p className={`mt-1 text-xs text-neutral-600 ${bn}`}>{t("myBookings.confirmAmountDesc")}</p>
          <div className="mt-3 flex gap-2">
            <button disabled={busy} onClick={() => confirmAmount(true)} className={`btn-primary px-4 py-2.5 text-sm ${bn}`}>{t("myBookings.confirm")}</button>
            <button disabled={busy} onClick={() => confirmAmount(false)} className={`btn-secondary px-4 py-2.5 text-sm ${bn}`}>{t("myBookings.rejectAmount")}</button>
          </div>
        </div>
      )}
      {b.agreed_amount !== null && b.amount_confirmed && (
        <p className={`mt-3 text-sm font-semibold text-success-700 ${bn}`}>✓ {t("myBookings.amountAgreed")}: {formatRupees(b.agreed_amount)}</p>
      )}

      {b.status === "completed" && <ReviewBox booking={b} />}

      <div className="mt-4 space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wide text-neutral-400 ${bn}`}>{t("myBookings.contactProvider")}</p>
        <ContactButtons bookingId={b.id} reference={b.reference} status={b.status} preference={b.contact_preference} audience="provider" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
        {canCancel(b.status) && !cancelOpen && (
          <button onClick={() => setCancelOpen(true)} className={`btn-ghost text-error-600 ${bn}`}>{t("myBookings.cancel")}</button>
        )}
        {!complaintOpen && b.provider_id && (
          <button onClick={() => setComplaintOpen(true)} className={`btn-ghost ${bn}`}><Flag className="h-4 w-4" /> {t("complaint.raise")}</button>
        )}
      </div>

      {cancelOpen && (
        <div className="mt-3 space-y-3">
          <p className={`text-sm text-neutral-700 ${bn}`}>{t("myBookings.cancelConfirm")}</p>
          <FormField label={t("myBookings.cancelReason")} required>
            <Input value={reason} onChange={setReason} />
          </FormField>
          <div className="flex gap-2">
            <button disabled={busy} onClick={cancel} className={`btn-danger px-4 py-2.5 text-sm ${bn}`}>{t("myBookings.cancel")}</button>
            <button onClick={() => setCancelOpen(false)} className={`btn-ghost ${bn}`}>{t("admin.cancel")}</button>
          </div>
        </div>
      )}

      {complaintOpen && (
        <div className="mt-3 space-y-3">
          <FormField label={t("complaint.subject")} required>
            <Input value={subject} onChange={setSubject} />
          </FormField>
          <FormField label={t("complaint.details")} required>
            <TextArea value={complaintText} onChange={setComplaintText} />
          </FormField>
          <div className="flex gap-2">
            <button disabled={busy} onClick={submitComplaint} className={`btn-primary px-4 py-2.5 text-sm ${bn}`}>{t("complaint.submit")}</button>
            <button onClick={() => setComplaintOpen(false)} className={`btn-ghost ${bn}`}>{t("admin.cancel")}</button>
          </div>
        </div>
      )}

      {msg && <div className="mt-3"><AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg(null)} /></div>}
    </article>
  );
}
