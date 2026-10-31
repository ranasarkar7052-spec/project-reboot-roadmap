import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Phone, MapPin, Briefcase, Clock, CheckCircle2, XCircle } from "lucide-react";
import { FormField, Input, TextArea, AlertMessage } from "@/components/ui/app-form";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, catName } from "@/lib/api";
import { validateIndianPhone, normalizeIndianPhone, getErrorMessage } from "@/lib/validation";
import type { ProviderProfile } from "@/lib/db-types";

export function useMyProviderProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-provider-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("provider_profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data as ProviderProfile | null;
    },
  });
}

export function ProviderStatusCard({ profile }: { profile: ProviderProfile }) {
  const { t } = useI18n();
  if (profile.verification_status === "approved")
    return (
      <div className="space-y-3">
        <AlertMessage type="success" title={t("providerReg.approvedTitle")} message={t("providerReg.approvedDesc")} />
        <Link to="/provider/dashboard" className="btn-primary w-full">
          <CheckCircle2 className="h-5 w-5" /> {t("nav.dashboard")}
        </Link>
      </div>
    );
  if (profile.verification_status === "rejected")
    return (
      <div className="space-y-3">
        <AlertMessage type="error" title={t("providerReg.rejectedTitle")} message={t("providerReg.rejectedDesc")} />
        {profile.verification_note && (
          <div className="card flex items-start gap-2 p-4 text-sm text-neutral-600">
            <XCircle className="h-4 w-4 shrink-0 text-error-500" /> {profile.verification_note}
          </div>
        )}
      </div>
    );
  return (
    <AlertMessage type="warning" title={t("providerReg.pendingTitle")} message={t("providerReg.pendingDesc")} />
  );
}

export function ProviderForm({ existing, onSaved }: { existing?: ProviderProfile | null; onSaved: () => void }) {
  const { t, lang } = useI18n();
  const { session, profile, refreshProfile } = useAuth();
  const bn = lang === "bn" ? "font-bengali" : "";
  const { data: categories = [] } = useQuery(categoriesQuery);

  const [contact, setContact] = useState(existing?.contact_number ?? profile?.phone ?? "");
  const [cats, setCats] = useState<string[]>(existing?.category_ids ?? []);
  const [areas, setAreas] = useState((existing?.service_areas ?? (profile?.village ? [profile.village] : [])).join(", "));
  const [experience, setExperience] = useState(String(existing?.experience_years ?? ""));
  const [qualification, setQualification] = useState(existing?.qualification_details ?? "");
  const [photoUrl, setPhotoUrl] = useState(existing?.photo_url ?? "");
  const [hours, setHours] = useState(existing?.working_hours ?? "09:00 - 18:00");
  const [available, setAvailable] = useState(existing?.is_available ?? true);
  const [consent, setConsent] = useState(existing?.consent_given ?? false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing && profile?.phone && !contact) setContact(profile.phone);
  }, [profile, existing, contact]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string | null> = {};
    if (!validateIndianPhone(contact)) errs.contact = getErrorMessage("phone", lang);
    if (cats.length === 0) errs.cats = getErrorMessage("required", lang);
    const areaList = areas.split(",").map((a) => a.trim()).filter(Boolean).slice(0, 20);
    if (areaList.length === 0) errs.areas = getErrorMessage("required", lang);
    const exp = Number(experience);
    if (!Number.isInteger(exp) || exp < 0 || exp > 70) errs.experience = t("providerReg.experienceInvalid");
    if (photoUrl && !/^https?:\/\/.{3,}/.test(photoUrl)) errs.photoUrl = t("providerReg.photoInvalid");
    if (!consent) errs.consent = t("providerReg.consentRequired");
    setErrors(errs);
    if (Object.values(errs).some(Boolean) || !session) return;

    setSaving(true);
    setServerError(null);
    const payload = {
      id: session.user.id,
      contact_number: normalizeIndianPhone(contact),
      category_ids: cats,
      service_areas: areaList.map((a) => a.slice(0, 80)),
      experience_years: exp,
      qualification_details: qualification.trim().slice(0, 500),
      photo_url: photoUrl.trim().slice(0, 500),
      working_hours: hours.trim().slice(0, 100),
      is_available: available,
      consent_given: true,
    };
    const { error } = existing
      ? await supabase.from("provider_profiles").update(payload).eq("id", session.user.id)
      : await supabase.from("provider_profiles").insert({ ...payload, consent_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      setServerError(error.message);
      return;
    }
    await refreshProfile();
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {serverError && <AlertMessage type="error" message={serverError} onClose={() => setServerError(null)} />}

      <FormField label={t("providerReg.contactNumber")} required error={errors.contact}>
        <Input value={contact} onChange={setContact} placeholder="98765 43210" type="tel" error={errors.contact} icon={<Phone className="h-5 w-5" />} />
      </FormField>

      <FormField label={t("providerReg.serviceCategories")} required error={errors.cats}>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])}
                className={`rounded-xl px-4 py-3.5 text-left text-sm font-semibold ring-1 ring-inset transition-all ${on ? "bg-primary-50 text-primary-700 ring-primary-400" : "bg-white text-neutral-700 ring-neutral-200 hover:ring-primary-200"} ${bn}`}
                aria-pressed={on}
              >
                {on ? "✓ " : ""}
                {catName(c, lang)}
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField label={t("providerReg.serviceAreas")} required error={errors.areas}>
        <Input value={areas} onChange={setAreas} placeholder="Bolpur, Santiniketan" error={errors.areas} icon={<MapPin className="h-5 w-5" />} />
        <p className={`mt-1 text-xs text-neutral-500 ${bn}`}>{t("providerReg.serviceAreasHint")}</p>
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={t("providerReg.experience")} required error={errors.experience}>
          <Input value={experience} onChange={setExperience} type="number" placeholder="5" error={errors.experience} icon={<Briefcase className="h-5 w-5" />} />
        </FormField>
        <FormField label={t("providerReg.workingHours")}>
          <Input value={hours} onChange={setHours} placeholder="09:00 - 18:00" icon={<Clock className="h-5 w-5" />} />
        </FormField>
      </div>

      <FormField label={t("providerReg.qualification")}>
        <TextArea value={qualification} onChange={setQualification} placeholder={t("providerReg.qualificationHint")} />
      </FormField>

      <FormField label={t("providerReg.photoUrl")} error={errors.photoUrl}>
        <Input value={photoUrl} onChange={setPhotoUrl} placeholder="https://..." error={errors.photoUrl} />
      </FormField>

      <label className={`flex items-center gap-3 rounded-xl bg-white p-4 shadow-card ring-1 ring-neutral-200 ${bn}`}>
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-5 w-5 accent-primary-600" />
        <span className="text-sm font-medium text-neutral-700">{t("providerReg.availability")}</span>
      </label>

      <div>
        <label className={`flex items-start gap-3 rounded-xl bg-primary-50 p-4 ring-1 ${errors.consent ? "ring-error-300" : "ring-primary-200"} ${bn}`}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary-600" disabled={!!existing} />
          <span className="text-sm text-neutral-700">{t("providerReg.consent")}</span>
        </label>
        {errors.consent && <p className={`mt-1 text-xs text-error-600 ${bn}`}>{errors.consent}</p>}
      </div>

      <button type="submit" disabled={saving} className={`btn-primary w-full ${bn}`}>
        {saving ? t("providerReg.submitting") : existing ? t("misc.save") : t("providerReg.submit")}
      </button>
    </form>
  );
}

