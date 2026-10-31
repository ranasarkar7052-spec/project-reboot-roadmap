import { Home, LayoutGrid, Plus, MessageCircle, UserRound } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

/** Customer mobile bottom bar: Home · Services · Book Now (FAB) · Chats · Profile. Same destinations as the header. */
export function BottomNav() {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const bn = lang === 'bn' ? 'font-bengali' : '';
  const item = `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-neutral-500 ${bn}`;
  const active = { className: 'text-primary-600 font-semibold' };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end px-2">
        <Link to="/" activeOptions={{ exact: true }} activeProps={active} className={item}>
          <Home className="h-5 w-5" /> {t('nav.home')}
        </Link>
        <Link to="/browse" activeProps={active} className={item}>
          <LayoutGrid className="h-5 w-5" /> {t('nav.services')}
        </Link>
        <Link to="/booking" activeProps={active} className={`${item} -mt-6`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-fab ring-4 ring-white transition-transform active:scale-95">
            <Plus className="h-7 w-7" />
          </span>
          {t('nav.bookNow')}
        </Link>
        <Link to="/notifications" activeProps={active} className={item}>
          <MessageCircle className="h-5 w-5" /> {t('nav.chats')}
        </Link>
        {session ? (
          <Link to="/customer/profile" activeProps={active} className={item}>
            <UserRound className="h-5 w-5" /> {t('nav.profile')}
          </Link>
        ) : (
          <Link to="/login" activeProps={active} className={item}>
            <UserRound className="h-5 w-5" /> {t('nav.profile')}
          </Link>
        )}
      </div>
    </nav>
  );
}
