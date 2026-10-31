import { useState } from "react";
import { FormField, Input, AlertMessage } from "@/components/ui/app-form";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { validateIndianPhone, normalizeIndianPhone, getErrorMessage } from "@/lib/validation";
import { validateProfileInput } from "@/lib/profile-rules";
import { LocationPicker } from "@/components/LocationPicker";

const FIELDS = ["full_name", "phone", "address_line", "village", "post_office", "pin_code", "district", "state", "landmark"] as const;
type Field = (typeof FIELDS)[number];

/** View / edit the signed-in user's own profile (customers and providers). */
export function ProfileDetailsForm({ isProvider, onSaved }: { isProvider?: boolean; onSaved?: () => void }) {
  const { lang } = useI18n();
  const { session, profile, refreshProfile } = useAuth();
  const bnl = lang === "bn";
  const bn = bnl ? "font-bengali" : "";
  const L = (en: string, b: string) => (bnl ? b : en);
  const initial = () => Object.fromEntries(FIELDS.map((f) => [f, String((profile as unknown as Record<string, unknown>)?.[f] ?? "")])) as Record<Field, string>;
  // New accounts (e.g. first Google sign-in) open straight into edit mode to complete required details.
  const [editing, setEditing] = useState(() => !!profile && (!profile.phone || !profile.village || !profile.full_name));
  const [v, setV] = useState<Record<Field, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  if (!profile || !session) return null;
  // View mode reads the loaded profile directly: on a hard refresh the profile
  // arrives after first render, so the edit-state snapshot would still be empty.
  const saved = initial();

  const labels: Record<Field, string> = {
    full_name: L("Full name", "পুরো নাম"),
    phone: L("Phone number", "ফোন নম্বর"),
    address_line: L("House / street", "বাড়ি / রাস্তা"),
    village: L("Village / locality", "গ্রাম / এলাকা"),
    post_office: L("Post office", "পোস্ট অফিস"),
    pin_code: L("PIN code", "পিন কোড"),
    district: L("District", "জেলা"),
    state: L("State", "রাজ্য"),
    landmark: L("Landmark (optional)", "ল্যান্ডমার্ক (ঐচ্ছিক)"),
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateProfileInput(v);
    const out: Record<string, string | null> = {};
    if (errs.full_name) out.full_name = getErrorMessage("required", lang);
    if (errs.phone || (v.phone && !validateIndianPhone(v.phone))) out.phone = getErrorMessage("phone", lang);
    if (errs.pin_code) out.pin_code = L("Enter a 6-digit PIN code", "৬ সংখ্যার পিন কোড দিন");
    setErrors(out);
    if (Object.values(out).some(Boolean)) return;
    setSaving(true);
    const payload = Object.fromEntries(FIELDS.map((f) => [f, v[f].trim().slice(0, 120)])) as Record<Field, string>;
    payload.phone = normalizeIndianPhone(payload.phone);
    const { error } = await supabase.from("profiles").update({ ...payload, ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}) }).eq("id", session!.user.id);
    setSaving(false);
    if (error) { setMsg({ type: "error", text: error.message }); return; }
    await refreshProfile();
    onSaved?.();
    setEditing(false);
    setMsg({ type: "success", text: L("Profile saved", "প্রোফাইল সংরক্ষিত হয়েছে") });
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className={`text-lg font-bold text-neutral-900 ${bn}`}>{L("Personal & address details", "ব্যক্তিগত ও ঠিকানার তথ্য")}</h2>
        {!editing && <button type="button" onClick={() => { setV(initial()); setEditing(true); setMsg(null); }} className={`btn-secondary px-4 py-2 text-sm ${bn}`}>{L("Edit", "সম্পাদনা")}</button>}
      </div>
      {msg && <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      {isProvider && editing && (
        <AlertMessage type="warning" message={L("Changing your name, phone or village sends your provider profile back for admin re-verification. You won't get new bookings until it is approved.", "নাম, ফোন বা গ্রাম বদলালে আপনার প্রোফাইল আবার অ্যাডমিন যাচাইয়ে যাবে। অনুমোদন না হওয়া পর্যন্ত নতুন বুকিং পাবেন না।")} />
      )}
      <FormField label={L("Email", "ইমেল")}>
        <Input value={session.user.email ?? ""} onChange={() => {}} disabled />
      </FormField>
      {editing && (
        <LocationPicker onConfirm={(a) => {
          const fill: Partial<Record<Field, string>> = {};
          (["address_line", "village", "post_office", "pin_code", "district", "state"] as const).forEach((k) => { if (a[k]) fill[k] = a[k]; });
          setV((cur) => ({ ...cur, ...fill }));
          setCoords({ lat: a.lat, lng: a.lng });
        }} />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <FormField key={f} label={labels[f]} required={f === "full_name"} error={errors[f]}>
            {editing ? (
              <Input value={v[f]} onChange={(x) => setV({ ...v, [f]: x })} error={errors[f]} type={f === "phone" ? "tel" : "text"} />
            ) : (
              <p className={`rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-800 ${bn}`}>{saved[f] || "—"}</p>
            )}
          </FormField>
        ))}
      </div>
      {editing && (
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className={`btn-primary ${bn}`}>{saving ? L("Saving…", "সংরক্ষণ হচ্ছে…") : L("Save changes", "পরিবর্তন সংরক্ষণ")}</button>
          <button type="button" onClick={() => { setEditing(false); setErrors({}); setV(initial()); }} className={`btn-secondary ${bn}`}>{L("Cancel", "বাতিল")}</button>
        </div>
      )}
    </form>
  );
}
