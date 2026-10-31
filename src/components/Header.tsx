import { Wrench, Menu, X, Bell, LogOut, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { LanguageToggle } from './LanguageToggle';
import { notificationSide } from '@/lib/portal';

function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    let active = true;
    const load = () =>
      supabase
        .from('notifications')
        .select('type, booking_id, bookings(customer_id)')
        .eq('user_id', userId)
        .eq('is_read', false)
        .then(({ data }) => active && setCount((data ?? []).filter((n) => notificationSide(n, userId) === 'customer').length));
    load();
    const channel = supabase
      .channel(`notif-${userId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    const onRead = () => load();
    window.addEventListener('notifications-changed', onRead);
    return () => {
      active = false;
      supabase.removeChannel(channel);
      window.removeEventListener('notifications-changed', onRead);
    };
  }, [userId]);
  return count;
}

export function Header() {
  const { t, lang } = useI18n();
  const { session, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = useUnreadCount(session?.user.id);
  const bn = lang === 'bn' ? 'font-bengali' : '';

  type NavTo = '/' | '/browse' | '/customer/bookings' | '/provider/dashboard' | '/provider-register' | '/admin/dashboard';
  const navLinks: { label: string; to: NavTo }[] = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.browse'), to: '/browse' },
  ];
  if (session) {
    navLinks.push({ label: t('nav.myBookings'), to: '/customer/bookings' });
    if (!hasRole('provider')) navLinks.push({ label: t('nav.becomeProvider'), to: '/provider-register' });
    if (hasRole('admin')) navLinks.push({ label: t('nav.admin'), to: '/admin/dashboard' });
  } else {
    navLinks.push({ label: t('nav.becomeProvider'), to: '/provider-register' });
  }

  async function handleSignOut() {
    setMobileOpen(false);
    await signOut();
    navigate({ to: '/', replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 transition-transform active:scale-95">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-card">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="leading-none">
            <span className="text-xl font-extrabold tracking-tight text-neutral-900">Local<span className="text-primary-600">Fix</span></span>
            <span className="block text-[10px] font-medium text-neutral-400">{t('brand.tagline')}</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === '/' }}
              activeProps={{ className: 'bg-primary-50 text-primary-700' }}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${bn}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {session && (
            <Link
              to="/notifications"
              className="relative rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label={t('nav.notifications')}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )}
          {session && (
            <Link
              to="/customer/profile"
              activeProps={{ className: 'bg-primary-50 text-primary-700' }}
              className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label={lang === 'bn' ? 'আমার প্রোফাইল' : 'My profile'}
              title={lang === 'bn' ? 'আমার প্রোফাইল' : 'My profile'}
            >
              <UserRound className="h-5 w-5" />
            </Link>
          )}
          {session ? (
            <button onClick={handleSignOut} className={`hidden btn-ghost lg:inline-flex ${bn}`}>
              <LogOut className="h-4 w-4" /> {t('nav.logout')}
            </button>
          ) : (
            <Link to="/login" className={`hidden btn-ghost lg:inline-flex ${bn}`}>
              {t('nav.login')}
            </Link>
          )}
          <Link to="/booking" className={`hidden btn-primary px-4 py-2.5 text-sm sm:inline-flex ${bn}`}>
            {t('nav.bookNow')}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white lg:hidden animate-fade-in">
          <nav className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-50 ${bn}`}
              >
                {link.label}
              </Link>
            ))}
            {session && (
              <Link to="/customer/profile" onClick={() => setMobileOpen(false)} className={`block rounded-lg px-3 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-50 ${bn}`}>
                {lang === 'bn' ? 'আমার প্রোফাইল' : 'My profile'}
              </Link>
            )}
            {session ? (
              <button onClick={handleSignOut} className={`block w-full rounded-lg px-3 py-3 text-left text-base font-medium text-neutral-700 hover:bg-neutral-50 ${bn}`}>
                {t('nav.logout')}
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className={`block rounded-lg px-3 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 ${bn}`}>
                {t('nav.login')}
              </Link>
            )}
            <Link to="/booking" onClick={() => setMobileOpen(false)} className={`btn-primary mt-2 w-full ${bn}`}>
              {t('nav.bookNow')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
