import { ArrowRight, ShieldCheck, IndianRupee, Zap } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useI18n } from '@/lib/i18n';
import { SearchBar } from './SearchBar';
import heroImg from '@/assets/hero-technician.jpg';

interface HeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onPopularTagClick: (tag: string) => void;
  popularTags: { label: string; value: string }[];
  /** Live counts from the backend; hidden while loading. */
  stats?: { providers: number; categories: number } | null;
}

export function Hero({ searchValue, onSearchChange, onSearchSubmit, onPopularTagClick, popularTags, stats }: HeroProps) {
  const { t, lang } = useI18n();
  const bn = lang === 'bn' ? 'font-bengali' : '';
  const features = [
    { icon: ShieldCheck, label: t('home.f1'), cls: 'bg-success-500' },
    { icon: IndianRupee, label: t('home.f2'), cls: 'bg-success-600' },
    { icon: Zap, label: t('home.f3'), cls: 'bg-warning-400' },
  ];

  return (
    <section id="home" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
        <SearchBar value={searchValue} onChange={onSearchChange} onSubmit={onSearchSubmit} />

        <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-r from-primary-800 via-primary-700 to-primary-500 shadow-card-hover">
          <img
            src={heroImg}
            alt="LocalFix technician"
            width={1280}
            height={768}
            className="absolute inset-y-0 right-0 h-full w-3/5 object-cover object-right opacity-35 sm:opacity-90 [mask-image:linear-gradient(to_right,transparent,black_45%)]"
          />
          <div className="relative grid gap-4 p-5 sm:p-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-md">
              <h1 className={`text-2xl font-extrabold leading-tight text-white sm:text-4xl ${bn}`}>{t('home.heroTitle')}</h1>
              <p className={`mt-2 text-sm text-white/85 sm:text-base ${bn}`}>{t('home.heroSub')}</p>
              <Link to="/booking" className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 shadow-card transition-transform active:scale-95 ${bn}`}>
                {t('home.bookService')} <ArrowRight className="h-4 w-4" />
              </Link>
              {stats && (
                <div className="mt-5 flex gap-5 text-white">
                  <div><p className="text-xl font-bold">{stats.providers}</p><p className={`text-xs text-white/75 ${bn}`}>{t('misc.verifiedProviders')}</p></div>
                  <div className="border-l border-white/25 pl-5"><p className="text-xl font-bold">{stats.categories}</p><p className={`text-xs text-white/75 ${bn}`}>{t('misc.serviceCategories')}</p></div>
                </div>
              )}
            </div>
            <div className="hidden flex-col justify-center gap-3 md:flex">
              {features.map(({ icon: Icon, label, cls }) => (
                <div key={label} className="flex w-48 items-center gap-3 rounded-2xl bg-white/85 px-3 py-2.5 shadow-soft backdrop-blur">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${cls}`}><Icon className="h-5 w-5" /></span>
                  <span className={`text-sm font-medium leading-tight text-neutral-800 ${bn}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
