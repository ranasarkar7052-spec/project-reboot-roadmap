import type { ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { PortalLayout } from './PortalLayout';
import { BottomNav } from './BottomNav';

/** Picks the portal shell from the URL: /provider/* and /admin/* get their own layouts. */
export function AppLayout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const body = wide ? <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</div> : children;
  if (path.startsWith('/provider/')) return <PortalLayout portal="provider">{body}</PortalLayout>;
  if (path.startsWith('/admin/')) return <PortalLayout portal="admin">{body}</PortalLayout>;
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 pb-20 lg:pb-0">
      <Header />
      <main className="flex-1">{body}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
