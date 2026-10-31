import { useI18n } from '@/lib/i18n';
import type { BookingStatus } from '@/lib/db-types';

const styles: Record<BookingStatus, string> = {
  requested: 'bg-warning-50 text-warning-700 ring-warning-200',
  accepted: 'bg-primary-50 text-primary-700 ring-primary-200',
  on_the_way: 'bg-primary-50 text-primary-700 ring-primary-200',
  in_progress: 'bg-accent-50 text-accent-700 ring-accent-200',
  completed: 'bg-success-50 text-success-700 ring-success-200',
  rejected: 'bg-error-50 text-error-700 ring-error-200',
  cancelled: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t, lang } = useI18n();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]} ${lang === 'bn' ? 'font-bengali' : ''}`}>
      {t(`myBookings.status.${status}`)}
    </span>
  );
}
