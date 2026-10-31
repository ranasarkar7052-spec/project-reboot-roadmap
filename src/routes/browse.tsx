import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { BadgeCheck, MapPin, Briefcase, Clock, Wrench } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui/app-form";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { useI18n } from "@/lib/i18n";
import { categoriesQuery, providersQuery, catName } from "@/lib/api";
import { formatRupees, categories as categoryVisuals } from "@/lib/data";

export const Route = createFileRoute("/browse")({
  validateSearch: z.object({ category: z.string().optional(), area: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Browse verified providers — LocalFix" },
      { name: "description", content: "Filter verified electricians, plumbers and repair workers by service and village." },
      { property: "og:title", content: "Browse verified providers — LocalFix" },
      { property: "og:description", content: "Filter verified local repair workers by service and village." },
    ],
  }),
  component: BrowsePage,
});

const selectCls =
  "w-full rounded-xl border-0 bg-white px-4 py-3.5 text-base text-neutral-800 shadow-card ring-1 ring-inset ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500";

function BrowsePage() {
  const { t, lang } = useI18n();
  const bn = lang === "bn" ? "font-bengali" : "";
  const { category, area } = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const cats = useQuery(categoriesQuery);
  const providers = useQuery(providersQuery);

  const selectedCat = cats.data?.find((c) => c.slug === category);
  const allAreas = useMemo(() => {
    const s = new Set<string>();
    providers.data?.forEach((p) => p.service_areas.forEach((a) => s.add(a)));
    return [...s].sort();
  }, [providers.data]);

  const filtered = useMemo(() => {
    return (providers.data ?? []).filter((p) => {
      if (selectedCat && !p.category_ids.includes(selectedCat.id)) return false;
      if (area && !p.service_areas.some((a) => a.toLowerCase() === area.toLowerCase())) return false;
      return true;
    });
  }, [providers.data, selectedCat, area]);

  const loading = cats.isLoading || providers.isLoading;
  const failed = cats.isError || providers.isError;

  return (
    <AppLayout wide>
      <PageHeader title={t("svc.title")} subtitle={t("svc.subtitle")} />

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {[{ slug: undefined as string | undefined, label: t("svc.all") }, ...(cats.data ?? []).map((c) => ({ slug: c.slug as string | undefined, label: catName(c, lang) }))].map((chip) => {
          const on = (category ?? undefined) === chip.slug;
          return (
            <button
              key={chip.slug ?? "all"}
              onClick={() => navigate({ search: (s) => ({ ...s, category: chip.slug }) })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${on ? "bg-primary-600 text-white shadow-soft" : "bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:ring-primary-300"} ${bn}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {(cats.data?.length ?? 0) > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {cats.data!.map((c) => {
            const v = categoryVisuals.find((x) => x.id === c.slug);
            const Icon = v?.icon ?? Wrench;
            const on = category === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => navigate({ search: (s) => ({ ...s, category: on ? undefined : c.slug }) })}
                className={`flex aspect-[5/4] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br p-2 text-center shadow-soft transition-all hover:-translate-y-0.5 ${v?.bgGradient ?? "from-neutral-100 to-neutral-200"} ${on ? "ring-2 ring-primary-500" : ""}`}
              >
                <Icon className={`h-9 w-9 ${v?.color ?? "text-neutral-700"}`} />
                <span className={`line-clamp-2 text-xs font-semibold text-neutral-800 sm:text-sm ${bn}`}>{catName(c, lang)}</span>
              </button>
            );
          })}
        </div>
      )}

      <h2 className={`mb-4 text-lg font-bold text-neutral-900 sm:text-2xl ${bn}`}>{t("svc.featured")}</h2>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={`mb-1.5 block text-sm font-semibold text-neutral-700 ${bn}`}>{t("browse.filterCategory")}</span>
          <select
            value={category ?? ""}
            onChange={(e) => navigate({ search: (s) => ({ ...s, category: e.target.value || undefined }) })}
            className={`${selectCls} ${bn}`}
          >
            <option value="">{t("browse.allCategories")}</option>
            {cats.data?.map((c) => (
              <option key={c.id} value={c.slug}>{catName(c, lang)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={`mb-1.5 block text-sm font-semibold text-neutral-700 ${bn}`}>{t("browse.filterArea")}</span>
          <select
            value={area ?? ""}
            onChange={(e) => navigate({ search: (s) => ({ ...s, area: e.target.value || undefined }) })}
            className={`${selectCls} ${bn}`}
          >
            <option value="">{t("browse.allAreas")}</option>
            {allAreas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <LoadingState message={t("state.loadingProviders")} />}
      {failed && (
        <ErrorState title={t("state.error")} description={t("state.errorDesc")} onRetry={() => { cats.refetch(); providers.refetch(); }} />
      )}
      {!loading && !failed && (providers.data?.length ?? 0) === 0 && (
        <EmptyState title={t("browse.noProvidersInArea")} description={t("browse.noProvidersInAreaDesc")} />
      )}
      {!loading && !failed && (providers.data?.length ?? 0) > 0 && filtered.length === 0 && (
        <EmptyState title={t("browse.noProviders")} description={t("browse.noProvidersDesc")} />
      )}

      {!loading && !failed && filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const provCats = (cats.data ?? []).filter((c) => p.category_ids.includes(c.id));
            const bookCat = selectedCat ?? provCats[0];
            return (
              <article key={p.id} className="card flex flex-col p-5 hover:shadow-card-hover">
                <div className="flex items-start gap-3">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.full_name} className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-xl font-bold text-primary-700">
                      {p.full_name.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-neutral-900">{p.full_name}</h3>
                    <p className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-success-700 ${bn}`}>
                      <BadgeCheck className="h-3.5 w-3.5" /> {t("browse.verified")}
                    </p>
                  </div>
                  {p.is_available && (
                    <span className={`rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-700 ${bn}`}>{t("worker.available")}</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {provCats.map((c) => (
                    <span key={c.id} className={`rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 ${bn}`}>{catName(c, lang)}</span>
                  ))}
                </div>
                <ul className={`mt-3 space-y-1.5 text-sm text-neutral-600 ${bn}`}>
                  <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-neutral-400" /> {p.experience_years} {t("browse.experience")}</li>
                  <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-neutral-400" /> {p.service_areas.join(", ")}</li>
                  {p.working_hours && <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-neutral-400" /> {p.working_hours}</li>}
                </ul>
                {bookCat && (
                  <p className={`mt-3 text-xs text-neutral-500 ${bn}`}>{t("cat.from")} {formatRupees(bookCat.starting_price)}</p>
                )}
                <Link
                  to="/booking"
                  search={{ category: bookCat?.slug, provider: p.id }}
                  className={`btn-primary mt-4 w-full py-3 text-sm ${bn}`}
                >
                  {t("browse.bookProvider")}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
