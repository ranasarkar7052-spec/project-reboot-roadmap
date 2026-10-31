import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Bell, CalendarPlus, ClipboardList, Search, ShieldCheck, UserRound } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { categories as categoryVisuals } from '@/lib/data';
import { categoriesQuery, providersQuery, ratingsQuery } from '@/lib/api';
import type { ServiceCategory, Worker } from '@/lib/types';
import { Header } from './Header';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { CategoryTile, CategoryCardSkeleton } from './CategoryCard';
import { WorkerCard, ProviderMiniCard } from './WorkerCard';
import { BottomNav } from './BottomNav';
import { Link } from '@tanstack/react-router';
import { BadgeIndianRupee, ArrowRight, ChevronRight } from 'lucide-react';
import { CTASection } from './CTASection';
import { BookingSection } from './BookingSection';
import { ProviderSection } from './ProviderSection';
import { Footer } from './Footer';
import { LoadingState, EmptyState, ErrorState } from './States';
import { useAuth } from '@/lib/auth';
import { QuickAccess, type QuickAccessItem } from './QuickAccess';

type LoadingPhase = 'loading' | 'loaded' | 'error';

const fallbackVisual = { icon: Wrench, color: 'text-neutral-700', bgGradient: 'from-neutral-100 to-neutral-200', popularTags: [] as string[] };

/** Live categories (admin-managed) and approved providers, shaped for the original home-page cards. */
export function useHomeData() {
  const { lang } = useI18n();
  const catsQ = useQuery(categoriesQuery);
  const provQ = useQuery(providersQuery);
  const ratingsQ = useQuery(ratingsQuery);

  const categories = useMemo<ServiceCategory[]>(() => {
    return (catsQ.data ?? [])
      .filter((c) => c.is_active)
      .map((c) => {
        const visual = categoryVisuals.find((v) => v.id === c.slug) ?? fallbackVisual;
        return {
          id: c.slug,
          dbId: c.id,
          title: lang === 'bn' ? c.name_bn : c.name_en,
          desc: lang === 'bn' ? c.desc_bn : c.desc_en,
          icon: visual.icon,
          color: visual.color,
          bgGradient: visual.bgGradient,
          popularTags: visual.popularTags,
          startingPrice: c.starting_price,
          workerCount: (provQ.data ?? []).filter((p) => p.category_ids.includes(c.id)).length,
        };
      });
  }, [catsQ.data, provQ.data, lang]);

  const workers = useMemo<Worker[]>(() => {
    const ratings = new Map((ratingsQ.data ?? []).map((r) => [r.provider_id, r]));
    const out: Worker[] = [];
    for (const p of provQ.data ?? []) {
      for (const c of categories) {
        if (!c.dbId || !p.category_ids.includes(c.dbId)) continue;
        const r = ratings.get(p.id);
        out.push({
          id: p.id,
          name: p.full_name || '—',
          nameBn: p.full_name || '—',
          category: c.id,
          area: p.service_areas.join(', '),
          areaBn: p.service_areas.join(', '),
          experienceYears: p.experience_years,
          jobsCompleted: 0,
          reviewCount: r?.review_count ?? 0,
          visitFee: c.startingPrice,
          availableToday: p.is_available,
          rating: r ? r.avg_rating : null,
        });
      }
    }
    return out;
  }, [provQ.data, ratingsQ.data, categories]);

  const phase: LoadingPhase = catsQ.isError || provQ.isError ? 'error' : catsQ.isLoading || provQ.isLoading ? 'loading' : 'loaded';
  const retry = () => { catsQ.refetch(); provQ.refetch(); ratingsQ.refetch(); };
  const stats = phase === 'loaded' ? { providers: provQ.data?.length ?? 0, categories: categories.length } : null;
  return { categories, workers, phase, retry, stats };
}

export function HomePage() {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const { categories, workers, phase, retry, stats } = useHomeData();
  const { session, hasRole } = useAuth();

  // The same options the header nav already exposes, gathered in one place
  // for signed-in customers (roles decide which of them appear).
  const quickItems: QuickAccessItem[] = session
    ? [
        { to: '/browse', label: t('nav.browse'), icon: Search },
        { to: '/customer/bookings', label: t('nav.myBookings'), icon: ClipboardList },
        { to: '/customer/profile', label: bengali ? 'আমার প্রোফাইল' : 'My profile', icon: UserRound },
        { to: '/notifications', label: t('nav.notifications'), icon: Bell },
        { to: '/booking', label: t('nav.bookNow'), icon: CalendarPlus },
        ...(hasRole('provider') ? [] : [{ to: '/provider-register', label: t('nav.becomeProvider'), icon: Wrench }]),
        ...(hasRole('admin') ? [{ to: '/admin/dashboard', label: t('nav.admin'), icon: ShieldCheck }] : []),
      ]
    : [];

  const [searchValue, setSearchValue] = useState('');
  const categoriesLoading = phase;
  const workersLoading = phase;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookingCategory, setBookingCategory] = useState<string | null>(null);
  const [bookingWorker, setBookingWorker] = useState<Worker | null>(null);

  const filteredCategories = useMemo(() => {
    if (!searchValue.trim()) return categories;
    const q = searchValue.toLowerCase().trim();
    return categories.filter((cat) => {
      const title = (cat.title ?? t(`cat.${cat.id}.title`)).toLowerCase();
      const desc = (cat.desc ?? t(`cat.${cat.id}.desc`)).toLowerCase();
      const tags = cat.popularTags.join(' ').toLowerCase();
      return title.includes(q) || desc.includes(q) || tags.includes(q) || cat.id.includes(q);
    });
  }, [searchValue, t, categories]);

  const popularTags = useMemo(() => {
    return categories.slice(0, 5).map((c) => ({ label: c.title ?? t(`cat.${c.id}.title`), value: c.title ?? c.id }));
  }, [t, categories]);

  const categoryWorkers = useMemo(() => {
    if (!selectedCategory) return [];
    return workers.filter((w) => w.category === selectedCategory);
  }, [selectedCategory, workers]);

  const topProviders = useMemo(() => {
    const seen = new Set<string>();
    return [...workers]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
      .filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)))
      .slice(0, 10);
  }, [workers]);

  function handleCategorySelect(id: string) {
    setSelectedCategory(id);
    // Smooth scroll to workers section
    setTimeout(() => {
      document.getElementById('workers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handlePopularTagClick(tag: string) {
    setSearchValue(tag);
  }

  function handleBookWorker(worker: Worker) {
    setBookingWorker(worker);
    setBookingCategory(worker.category);
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleSearchSubmit() {
    if (filteredCategories.length === 1) {
      handleCategorySelect(filteredCategories[0]!.id);
    } else {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function retryCategories() {
    retry();
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 lg:pb-0">
      <Header />

      <Hero
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        onPopularTagClick={handlePopularTagClick}
        popularTags={popularTags}
        stats={stats}
      />

      {session && (
        <section className="border-b border-neutral-200/70 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
            <QuickAccess items={quickItems} />
          </div>
        </section>
      )}

      {/* Categories / Search results */}
      <section id="services" className="bg-white py-6 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className={`text-lg font-bold text-neutral-900 sm:text-2xl ${bengali ? 'font-bengali' : ''}`}>
              {searchValue.trim() ? t('misc.searchResults') : t('home.popular')}
            </h2>
            <Link to="/browse" className={`inline-flex shrink-0 items-center text-sm font-medium text-primary-600 ${bengali ? 'font-bengali' : ''}`}>
              {t('home.seeAll')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4">
            {categoriesLoading === 'loading' && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <CategoryCardSkeleton key={i} />
                ))}
              </div>
            )}

            {categoriesLoading === 'error' && (
              <ErrorState
                title={t('state.error')}
                description={t('state.errorDesc')}
                onRetry={retryCategories}
              />
            )}

            {categoriesLoading === 'loaded' && filteredCategories.length === 0 && (
              <EmptyState
                title={t('state.empty')}
                description={t('state.emptyDesc')}
              />
            )}

            {categoriesLoading === 'loaded' && filteredCategories.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {filteredCategories.map((cat) => (
                  <CategoryTile
                    key={cat.id}
                    category={cat}
                    onSelect={handleCategorySelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Promo + top rated providers (live data only) */}
      <section className="bg-white pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-accent-50 to-accent-100 p-4 sm:p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-soft">
              <BadgeIndianRupee className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-neutral-900 sm:text-lg ${bengali ? 'font-bengali' : ''}`}>{t('home.promoTitle')}</p>
              <p className={`text-xs text-neutral-600 sm:text-sm ${bengali ? 'font-bengali' : ''}`}>{t('home.promoSub')}</p>
            </div>
            <Link to="/booking" className={`hidden shrink-0 items-center gap-1.5 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-accent-600 sm:inline-flex ${bengali ? 'font-bengali' : ''}`}>
              {t('nav.bookNow')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {topProviders.length > 0 && (
            <div className="mt-7">
              <div className="flex items-end justify-between gap-3">
                <h2 className={`text-lg font-bold text-neutral-900 sm:text-2xl ${bengali ? 'font-bengali' : ''}`}>{t('home.topRated')}</h2>
                <Link to="/browse" className={`inline-flex shrink-0 items-center text-sm font-medium text-primary-600 ${bengali ? 'font-bengali' : ''}`}>
                  {t('home.seeAll')} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6">
                {topProviders.map((w) => (
                  <ProviderMiniCard
                    key={w.id}
                    worker={w}
                    categoryTitle={categories.find((c) => c.id === w.category)?.title ?? t(`cat.${w.category}.title`)}
                    onBook={handleBookWorker}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Workers for selected category */}
      {selectedCategory && (
        <section id="workers" className="bg-neutral-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`text-2xl font-bold text-neutral-900 sm:text-3xl ${bengali ? 'font-bengali' : ''}`}>
                  {categories.find((c) => c.id === selectedCategory)?.title ?? t(`cat.${selectedCategory}.title`)}
                </h2>
                <p className={`mt-1 text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
                  {t('cat.subtitle')}
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`btn-ghost ${bengali ? 'font-bengali' : ''}`}
              >
                {bengali ? '← সব শ্রেণী' : '← All categories'}
              </button>
            </div>

            <div className="mt-8">
              {workersLoading === 'loading' && (
                <LoadingState message={t('state.loadingWorkers')} />
              )}
              {workersLoading === 'error' && (
                <ErrorState
                  title={t('state.error')}
                  description={t('state.errorDesc')}
                  onRetry={retry}
                />
              )}
              {workersLoading === 'loaded' && categoryWorkers.length === 0 && (
                <EmptyState
                  title={t('state.empty')}
                  description={t('state.emptyDesc')}
                />
              )}
              {workersLoading === 'loaded' && categoryWorkers.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryWorkers.map((worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      onBook={handleBookWorker}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <HowItWorks />
      <CTASection />
      <ProviderSection />
      <BookingSection
        categories={categories}
        workers={workers}
        selectedCategory={bookingCategory}
        onCategorySelect={setBookingCategory}
        initialWorker={bookingWorker}
      />
      <Footer />
      <BottomNav />
    </div>
  );
}
