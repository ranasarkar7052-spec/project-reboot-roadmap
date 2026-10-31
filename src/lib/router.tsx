// Compatibility layer: the original screens call navigate({ name }) —
// this maps those names onto real TanStack Router paths.
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

export type AppRoute =
  | { name: 'home' }
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'provider-register' }
  | { name: 'provider-dashboard' }
  | { name: 'provider-profile' }
  | { name: 'browse'; categorySlug?: string }
  | { name: 'booking'; categorySlug?: string; providerId?: string }
  | { name: 'my-bookings' }
  | { name: 'admin' }
  | { name: 'notifications' };

export function useRouter() {
  const nav = useNavigate();
  const navigate = useCallback(
    (r: AppRoute) => {
      switch (r.name) {
        case 'home': return nav({ to: '/' });
        case 'login': return nav({ to: '/login' });
        case 'register': return nav({ to: '/register' });
        case 'provider-register': return nav({ to: '/provider-register' });
        case 'provider-dashboard': return nav({ to: '/provider/dashboard' });
        case 'provider-profile': return nav({ to: '/provider/profile' });
        case 'browse': return nav({ to: '/browse', search: { category: r.categorySlug } });
        case 'booking': return nav({ to: '/booking', search: { category: r.categorySlug, provider: r.providerId } });
        case 'my-bookings': return nav({ to: '/customer/bookings' });
        case 'admin': return nav({ to: '/admin/dashboard' });
        case 'notifications': return nav({ to: '/notifications' });
      }
    },
    [nav],
  );
  return { navigate };
}
