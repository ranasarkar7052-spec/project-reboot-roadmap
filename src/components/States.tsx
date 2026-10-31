import { SearchX, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function LoadingState({
  message,
  icon: Icon = Loader2,
}: {
  message: string;
  icon?: typeof Loader2;
}) {
  const { lang } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Icon className={`h-8 w-8 animate-spin text-primary-500 ${lang === 'bn' ? 'font-bengali' : ''}`} />
      <p className={`text-sm font-medium text-neutral-500 ${lang === 'bn' ? 'font-bengali' : ''}`}>
        {message}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { lang } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <SearchX className="h-8 w-8 text-neutral-400" />
      </div>
      <div>
        <h3 className={`text-base font-semibold text-neutral-700 ${lang === 'bn' ? 'font-bengali' : ''}`}>
          {title}
        </h3>
        <p className={`mx-auto mt-1 max-w-xs text-sm text-neutral-500 ${lang === 'bn' ? 'font-bengali' : ''}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  const { t, lang } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50">
        <AlertCircle className="h-8 w-8 text-error-500" />
      </div>
      <div>
        <h3 className={`text-base font-semibold text-neutral-700 ${lang === 'bn' ? 'font-bengali' : ''}`}>
          {title}
        </h3>
        <p className={`mx-auto mt-1 max-w-xs text-sm text-neutral-500 ${lang === 'bn' ? 'font-bengali' : ''}`}>
          {description}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`mt-1 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-error-600 ring-1 ring-inset ring-error-200 transition-colors hover:bg-error-50 ${lang === 'bn' ? 'font-bengali' : ''}`}
        >
          <RefreshCw className="h-4 w-4" />
          {t('state.retry')}
        </button>
      )}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card shimmer h-64 overflow-hidden">
      <div className="h-28 bg-neutral-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-neutral-100" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-1/2 rounded bg-neutral-100" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 rounded-lg bg-neutral-100" />
          <div className="h-9 flex-1 rounded-lg bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
