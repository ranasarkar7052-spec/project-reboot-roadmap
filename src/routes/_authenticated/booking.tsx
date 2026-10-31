import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LocationPicker } from "@/components/LocationPicker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { MapPin, Home, Landmark, CalendarDays, CheckCircle2, ImageIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { FormField, Input, TextArea, AlertMessage, PageContainer, PageHeader } from "@/components/ui/app-form";
import { LoadingState, ErrorState } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_STATUSES, categoriesQuery, providersQuery, catName, friendlyError, formatDate } from "@/lib/api";
import { formatRupees } from "@/lib/data";
import { getErrorMessage } from "@/lib/validation";
import type { ContactPreference } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/booking")({
  validateSearch: z.object({
    category: z.string().optional(),
    provider: z.string().optional(),
    // Optional prefill handed over from the home-page booking section.
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
    time: z.enum(["09", "11", "14", "16", "18"]).optional().catch(undefined),
    note: z.string().max(1000).optional().catch(undefined),
  }),
  head: () => ({
    meta: [
      { title: "Book a service — LocalFix" },
      { name: "description", content: "Request a verified local repair worker for your home or farm." },
      { property: "og:title", content: "Book a service — LocalFix" },
      { property: "og:description", content: "Request a verified local repair worker." },
    ],
  }),
  component: () => (
    <AppLayout>
      <BookingPage />
    </AppLayout>
  ),
});

const TIME_SLOTS = ["09", "11", "14", "16", "18"] as const;

function isoDate(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

const selectCls =
  "w-full rounded-xl border-0 bg-white px-4 py-3.5 text-base text-neutral-800 shadow-card ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-primary-500";

function BookingPage() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const search = Route.useSearch();
  const { session, profile } = useAuth();
  const qc = useQueryClient();
  const cats = useQuery(categoriesQuery);
  const providers = useQuery(providersQuery);

  const [categorySlug, setCategorySlug] = useState(search.category ?? "");
  const [providerId, setProviderId] = useState(search.provider ?? "");
  const [description, setDescription] = useState(search.note ?? "");
  const [village, setVillage] = useState(profile?.village ?? "");
  // Saved profile address pre-fills the form (customer can still change it per booking).
  const [address, setAddress] = useState(profile?.address_line ?? "");
  const [landmark, setLandmark] = useState(profile?.landmark ?? "");
  const pc = profile as unknown as { latitude?: number | null; longitude?: number | null } | null;
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(pc?.latitude != null && pc?.longitude != null ? { lat: pc.latitude, lng: pc.longitude } : null);
  const [date, setDate] = useState(search.date ?? "");
  const [time, setTime] = useState<string>(search.time ?? "");
  const [photoUrl, setPhotoUrl] = useState("");
  const [contactPref, setContactPref] = useState<ContactPreference>("either");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ reference: string } | null>(null);

  const today = isoDate(new Date());
  const maxDate = isoDate(new Date(Date.now() + 90 * 86400000));
  const category = cats.data?.find((c) => c.slug === categorySlug);
  const categoryProviders = useMemo(
    () => (providers.data ?? []).filter((p) => category && p.category_ids.includes(category.id)),
    [providers.data, category],
  );
  const provider = categoryProviders.find((p) => p.id === providerId);

  // Duplicate prevention: existing active booking for same service + date
  const duplicateCheck = useQuery({
    queryKey: ["dup-check", session?.user.id, category?.id, date],
    enabled: !!session && !!category && !!date,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, reference")
        .eq("customer_id", session!.user.id)
        .eq("category_id", category!.id)
        .eq("preferred_date", date)
        .in("status", ACTIVE_STATUSES)
        .limit(1);
      return data?.[0] ?? null;
    },
  });
  const duplicate = duplicateCheck.data;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const errs: Record<string, string | null> = {};
    if (!category) errs.category = t("booking.selectCategory");
    if (description.trim().length < 10) errs.description = t("booking.descriptionTooShort");
    if (!village.trim()) errs.village = getErrorMessage("required", lang);
    if (address.trim().length < 5) errs.address = getErrorMessage("required", lang);
    if (!date) errs.date = t("booking.selectDateFirst");
    else if (date < today || date > maxDate) errs.date = t("booking.dateInvalid");
    if (!time) errs.time = getErrorMessage("required", lang);
    if (photoUrl && !/^https?:\/\/.{3,}/.test(photoUrl)) errs.photoUrl = t("providerReg.photoInvalid");
    setErrors(errs);
    if (Object.values(errs).some(Boolean) || !session || !category) return;
    if (duplicate) return;

    setSubmitting(true);
    setServerError(null);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: session.user.id,
        provider_id: provider ? provider.id : null,
        category_id: category.id,
        description: description.trim().slice(0, 1000),
        village: village.trim().slice(0, 100),
        address: address.trim().slice(0, 300),
        landmark: landmark.trim().slice(0, 150),
        preferred_date: date,
        preferred_time: t(`booking.timeSlots.${time}`),
        photo_url: photoUrl.trim().slice(0, 500),
        contact_preference: contactPref,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      })
      .select("reference")
      .single();
    setSubmitting(false);
    if (error) {
      const fe = friendlyError(error.message);
      if (fe === "duplicate") {
        qc.invalidateQueries({ queryKey: ["dup-check"] });
        setServerError(t("booking.duplicateWarning"));
      } else setServerError(fe);
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-bookings"] });
    setCreated({ reference: data.reference });
    window.scrollTo(0, 0);
  }

  if (cats.isLoading || providers.isLoading) return <PageContainer><LoadingState message={t("misc.loading")} /></PageContainer>;
  if (cats.isError) return <PageContainer><ErrorState title={t("state.error")} description={t("state.errorDesc")} onRetry={() => cats.refetch()} /></PageContainer>;

  if (created) {
    return (
      <PageContainer>
        <div className="card flex flex-col items-center p-8 text-center animate-fade-in-up">
          <CheckCircle2 className="h-14 w-14 text-success-500" />
          <h1 className={`mt-4 text-2xl font-bold text-neutral-900 ${bn}`}>{t("booking.success")}</h1>
          <p className={`mt-2 text-neutral-500 ${bn}`}>{t("booking.successDesc")}</p>
          <div className="mt-5 rounded-xl bg-primary-50 px-6 py-3 ring-1 ring-primary-200">
            <p className={`text-xs font-semibold uppercase tracking-wide text-primary-600 ${bn}`}>{t("booking.bookingRef")}</p>
            <p className="text-2xl font-bold tracking-wider text-primary-800">{created.reference}</p>
          </div>
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/customer/bookings" className={`btn-primary ${bn}`}>{t("booking.viewMyBookings")}</Link>
            <button
              onClick={() => { setCreated(null); setDescription(""); setDate(""); setTime(""); setProviderId(""); }}
              className={`btn-secondary ${bn}`}
            >
              {t("booking.anotherBooking")}
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={t("booking.title")} subtitle={t("booking.subtitle")} backTo="/" />

      {category && (
        <div className="card mb-5 flex items-center gap-4 p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-warning-400 text-2xl font-extrabold text-neutral-900">
            {catName(category, lang).charAt(0)}
          </span>
          <div className="min-w-0">
            <p className={`truncate text-base font-bold text-neutral-900 ${bn}`}>{catName(category, lang)}</p>
            <p className={`text-sm text-neutral-500 ${bn}`}>
              {provider ? provider.full_name : t("booking.anyProvider")} · {t("cat.from")} {formatRupees(category.starting_price)}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <FormField label={t("booking.chooseCategory")} required error={errors.category}>
          <select
            value={categorySlug}
            onChange={(e) => { setCategorySlug(e.target.value); setProviderId(""); }}
            className={`${selectCls} ${errors.category ? "ring-error-300" : "ring-neutral-200"} ${bn}`}
          >
            <option value="">{t("booking.selectCategory")}</option>
            {cats.data?.map((c) => (
              <option key={c.id} value={c.slug}>{catName(c, lang)} — {t("cat.from")} {formatRupees(c.starting_price)}</option>
            ))}
          </select>
        </FormField>

        {category && (
          <FormField label={t("booking.selectProvider")}>
            <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className={`${selectCls} ring-neutral-200 ${bn}`}>
              <option value="">{t("booking.anyProvider")}</option>
              {categoryProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} · {p.experience_years} {t("browse.experience")} · {p.service_areas.slice(0, 2).join(", ")}
                </option>
              ))}
            </select>
            <p className={`mt-1 text-xs text-neutral-500 ${bn}`}>
              {categoryProviders.length === 0 ? t("booking.noProvidersYet") : t("booking.selectProviderHint")}
            </p>
          </FormField>
        )}

        <FormField label={t("booking.description")} required error={errors.description}>
          <TextArea value={description} onChange={setDescription} placeholder={t("booking.descriptionPlaceholder")} rows={4} error={errors.description} />
        </FormField>

        <LocationPicker onConfirm={(a) => {
          if (a.village) setVillage(a.village);
          const line = [a.address_line, a.post_office && `PO ${a.post_office}`, a.district, a.state, a.pin_code].filter(Boolean).join(", ");
          if (line) setAddress(line);
          setCoords({ lat: a.lat, lng: a.lng });
        }} />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={t("booking.village")} required error={errors.village}>
            <Input value={village} onChange={setVillage} error={errors.village} icon={<MapPin className="h-5 w-5" />} />
          </FormField>
          <FormField label={t("booking.landmark")}>
            <Input value={landmark} onChange={setLandmark} placeholder={t("booking.landmarkPlaceholder")} icon={<Landmark className="h-5 w-5" />} />
          </FormField>
        </div>

        <FormField label={t("booking.address")} required error={errors.address}>
          <Input value={address} onChange={setAddress} placeholder={t("booking.addressPlaceholder")} error={errors.address} icon={<Home className="h-5 w-5" />} />
        </FormField>

        <FormField label={t("booking.preferredDate")} required error={errors.date}>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="date"
              min={today}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${selectCls} pl-10 ${errors.date ? "ring-error-300" : "ring-neutral-200"}`}
            />
          </div>
        </FormField>

        <FormField label={t("booking.preferredTime")} required error={errors.time}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TIME_SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTime(s)}
                aria-pressed={time === s}
                className={`rounded-xl px-3 py-3 text-sm font-semibold ring-1 ring-inset transition-all ${time === s ? "bg-primary-600 text-white ring-primary-600" : "bg-white text-neutral-700 ring-neutral-200 hover:ring-primary-300"}`}
              >
                {t(`booking.timeSlots.${s}`)}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label={t("booking.photoUrl")} error={errors.photoUrl}>
          <Input value={photoUrl} onChange={setPhotoUrl} placeholder="https://..." error={errors.photoUrl} icon={<ImageIcon className="h-5 w-5" />} />
          <p className={`mt-1 text-xs text-neutral-500 ${bn}`}>{t("booking.photoUrlHint")}</p>
        </FormField>

        <FormField label={t("booking.contactPreference")}>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["call", "whatsapp", "either"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setContactPref(p)}
                aria-pressed={contactPref === p}
                className={`rounded-xl px-3 py-3 text-sm font-semibold ring-1 ring-inset transition-all ${contactPref === p ? "bg-primary-50 text-primary-700 ring-primary-400" : "bg-white text-neutral-700 ring-neutral-200"} ${bn}`}
              >
                {t(`booking.contactPref.${p}`)}
              </button>
            ))}
          </div>
        </FormField>

        {/* Summary */}
        <section className="card p-5 ring-1 ring-primary-100">
          <h2 className={`text-base font-bold text-neutral-900 ${bn}`}>{t("booking.summary")}</h2>
          <dl className={`mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm ${bn}`}>
            <dt className="text-neutral-500">{t("booking.summaryCategory")}</dt>
            <dd className="font-medium text-neutral-800">{category ? catName(category, lang) : "—"}</dd>
            <dt className="text-neutral-500">{t("booking.summaryProvider")}</dt>
            <dd className="font-medium text-neutral-800">{provider ? provider.full_name : t("booking.anyProvider")}</dd>
            <dt className="text-neutral-500">{t("booking.summaryDate")}</dt>
            <dd className="font-medium text-neutral-800">{date ? formatDate(date, lang) : "—"}</dd>
            <dt className="text-neutral-500">{t("booking.summaryTime")}</dt>
            <dd className="font-medium text-neutral-800">{time ? t(`booking.timeSlots.${time}`) : "—"}</dd>
            <dt className="text-neutral-500">{t("booking.summaryAddress")}</dt>
            <dd className="font-medium text-neutral-800">{[address, landmark, village].filter(Boolean).join(", ") || "—"}</dd>
            <dt className="text-neutral-500">{t("booking.summaryContactPref")}</dt>
            <dd className="font-medium text-neutral-800">{t(`booking.contactPref.${contactPref}`)}</dd>
          </dl>
          <p className={`mt-4 rounded-lg bg-warning-50 p-3 text-xs text-warning-800 ${bn}`}>{t("booking.priceNotice")}</p>
        </section>

        {duplicate && (
          <AlertMessage type="warning" message={`${t("booking.duplicateWarning")} (${duplicate.reference})`} />
        )}
        {serverError && <AlertMessage type="error" message={serverError} onClose={() => setServerError(null)} />}

        <div className="sticky bottom-20 z-10 -mx-1 rounded-2xl bg-neutral-50/90 p-1 backdrop-blur lg:bottom-4">
          <button type="submit" disabled={submitting || !!duplicate} className={`btn-primary w-full rounded-2xl py-4 shadow-fab ${bn}`}>
            {submitting ? t("booking.submitting") : t("booking.submit")}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
