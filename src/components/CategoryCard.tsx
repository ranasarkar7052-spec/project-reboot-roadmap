import { ArrowRight, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { ServiceCategory } from '@/lib/types';
import { formatRupees } from '@/lib/data';

interface CategoryCardProps {
  category: ServiceCategory;
  onSelect: (id: string) => void;
}

export function CategoryCard({ category, onSelect }: CategoryCardProps) {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const Icon = category.icon;

  const titleKey = `cat.${category.id}.title`;
  const descKey = `cat.${category.id}.desc`;

  return (
    <button
      onClick={() => onSelect(category.id)}
      className="card group flex flex-col items-start overflow-hidden p-0 text-left hover:shadow-card-hover hover:-translate-y-0.5 animate-fade-in-up"
      style={{ animationDelay: '0ms' }}
    >
      <div className={`flex h-24 w-full items-center justify-center bg-gradient-to-br ${category.bgGradient}`}>
        <Icon className={`h-11 w-11 ${category.color} transition-transform duration-300 group-hover:scale-110`} />
      </div>
      <div className="flex w-full flex-1 flex-col p-4">
        <h3 className={`text-base font-semibold text-neutral-900 ${bengali ? 'font-bengali' : ''}`}>
          {category.title ?? t(titleKey)}
        </h3>
        <p className={`mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
          {category.desc ?? t(descKey)}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-neutral-400">
          <Users className="h-3.5 w-3.5" />
          <span>{category.workerCount} {t('misc.serviceProviders')}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
          <span className={`text-sm ${bengali ? 'font-bengali' : ''}`}>
            <span className="text-neutral-400">{t('cat.from')} </span>
            <span className="font-semibold text-neutral-700">{formatRupees(category.startingPrice)}</span>
          </span>
          <span className={`inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition-transform group-hover:translate-x-0.5 ${bengali ? 'font-bengali' : ''}`}>
            {t('cat.viewWorkers')}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="card shimmer h-64 overflow-hidden">
      <div className="h-24 bg-neutral-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-neutral-100" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-1/3 rounded bg-neutral-100" />
        <div className="mt-3 h-8 w-full rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}

/** Compact pastel tile used on Home and Services grids; same onSelect action as CategoryCard. */
export function CategoryTile({ category, onSelect }: CategoryCardProps) {
  const { t, lang } = useI18n();
  const Icon = category.icon;
  return (
    <button
      onClick={() => onSelect(category.id)}
      className={`group flex aspect-[5/4] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br p-2 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${category.bgGradient}`}
    >
      <Icon className={`h-9 w-9 ${category.color} transition-transform group-hover:scale-110`} />
      <span className={`line-clamp-2 text-xs font-semibold text-neutral-800 sm:text-sm ${lang === 'bn' ? 'font-bengali' : ''}`}>
        {category.title ?? t(`cat.${category.id}.title`)}
      </span>
    </button>
  );
}
