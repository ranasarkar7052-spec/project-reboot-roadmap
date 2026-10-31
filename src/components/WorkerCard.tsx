import { Star, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Worker } from '@/lib/types';
import { formatRupees } from '@/lib/data';

interface WorkerCardProps {
  worker: Worker;
  onBook?: (worker: Worker) => void;
}

export function WorkerCard({ worker, onBook }: WorkerCardProps) {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const name = bengali ? worker.nameBn : worker.name;
  const area = bengali ? worker.areaBn : worker.area;

  return (
    <div className="card flex flex-col p-4 hover:shadow-card-hover animate-fade-in-up sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
          {name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`truncate text-base font-semibold text-neutral-900 ${bengali ? 'font-bengali' : ''}`}>
            {name}
          </h4>
          <div className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className={`truncate ${bengali ? 'font-bengali' : ''}`}>{area}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-warning-50 px-2 py-1">
          <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />
          <span className={`text-sm font-semibold text-warning-700 ${bengali ? 'font-bengali' : ''}`}>{worker.rating != null ? worker.rating.toFixed(1) : t('worker.new')}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 py-3 text-center">
        <div>
          <p className="text-lg font-bold text-neutral-800">{worker.experienceYears}</p>
          <p className={`text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>{t('worker.experience')}</p>
        </div>
        <div className="border-x border-neutral-200">
          <p className="text-lg font-bold text-neutral-800">{worker.reviewCount ?? worker.jobsCompleted}</p>
          <p className={`text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>{worker.reviewCount !== undefined ? t('worker.reviews') : t('worker.jobs')}</p>
        </div>
        <div>
          <p className="text-base font-bold text-neutral-800">{formatRupees(worker.visitFee)}</p>
          <p className={`text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>{t('worker.visitFee')}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {worker.availableToday ? (
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium text-success-600 ${bengali ? 'font-bengali' : ''}`}>
            <CheckCircle2 className="h-4 w-4" />
            {t('worker.available')}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 ${bengali ? 'font-bengali' : ''}`}>
            <Clock className="h-4 w-4" />
            {t('worker.unavailable')}
          </span>
        )}
        {onBook && (
          <button
            onClick={() => onBook(worker)}
            disabled={!worker.availableToday}
            className={`rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-300 ${bengali ? 'font-bengali' : ''}`}
          >
            {t('misc.bookNowShort')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Compact photo-style card for the horizontal "Top Rated Providers" row. */
export function ProviderMiniCard({ worker, categoryTitle, onBook }: { worker: Worker; categoryTitle: string; onBook?: (w: Worker) => void }) {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const name = bengali ? worker.nameBn : worker.name;
  return (
    <div className="card w-44 shrink-0 overflow-hidden hover:shadow-card-hover sm:w-52">
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
        <span className="text-4xl font-extrabold text-primary-700">{name.charAt(0)}</span>
        <span className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-success-500 px-2 py-0.5 text-[10px] font-semibold text-white ${bengali ? 'font-bengali' : ''}`}>
          <CheckCircle2 className="h-3 w-3" /> {t('home.verified')}
        </span>
      </div>
      <div className="p-3">
        <h4 className={`truncate text-sm font-bold text-neutral-900 ${bengali ? 'font-bengali' : ''}`}>{name}</h4>
        <p className={`truncate text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>{categoryTitle}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-700">
          <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
          <span className="font-semibold">{worker.rating != null ? worker.rating.toFixed(1) : t('worker.new')}</span>
          {worker.reviewCount ? <span className="text-neutral-400">({worker.reviewCount})</span> : null}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-400">
          <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{bengali ? worker.areaBn : worker.area}</span>
        </p>
        {onBook && (
          <button
            onClick={() => onBook(worker)}
            disabled={!worker.availableToday}
            className={`mt-2 w-full rounded-lg bg-primary-600 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary-700 disabled:bg-neutral-300 ${bengali ? 'font-bengali' : ''}`}
          >
            {worker.availableToday ? t('misc.bookNowShort') : t('worker.unavailable')}
          </button>
        )}
      </div>
    </div>
  );
}
