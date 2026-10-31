import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export type QuickAccessItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Compact strip of links to pages that already exist in the app.
 * Reused by the customer home page and the provider home page so the same
 * options are reachable in one place without duplicating any screen.
 */
export function QuickAccess({ items, className = '' }: { items: QuickAccessItem[]; className?: string }) {
  const { lang } = useI18n();
  const bn = lang === 'bn' ? 'font-bengali' : '';

  return (
    <nav
      className={`flex flex-wrap items-center gap-2 ${className}`}
      aria-label={lang === 'bn' ? 'দ্রুত লিংক' : 'Quick links'}
    >
      {items.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to as '/'} className={`btn-secondary px-4 py-2.5 text-sm ${bn}`}>
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}
