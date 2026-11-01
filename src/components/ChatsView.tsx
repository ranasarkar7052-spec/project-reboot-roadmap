import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Headset, Search, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { PageContainer, PageHeader } from './ui/app-form';

type ChatRow = {
  id: string;
  reference: string;
  status: string;
  preferred_date: string;
  providerName: string;
};

/** Customer chat list: pinned LocalFix Support entry plus one row per booking that has a provider. */
export function ChatsView() {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const bengali = lang === 'bn';
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, reference, status, preferred_date, provider_id')
        .eq('customer_id', session.user.id)
        .not('provider_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      const providerIds = [...new Set((bookings ?? []).map((b) => b.provider_id).filter(Boolean))] as string[];
      const names = new Map<string, string>();
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', providerIds);
        for (const p of profiles ?? []) names.set(p.id, p.full_name);
      }
      setRows(
        (bookings ?? []).map((b) => ({
          id: b.id,
          reference: b.reference,
          status: b.status,
          preferred_date: b.preferred_date,
          providerName: names.get(b.provider_id ?? '') ?? t('chats.provider'),
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.providerName.toLowerCase().includes(q) || r.reference.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <PageContainer>
      <PageHeader title={t('chats.title')} subtitle={t('chats.subtitle')} />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('chats.search')}
          className={`w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 ${bengali ? 'font-bengali' : ''}`}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <Link
          to="/chats/support"
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5 transition-colors hover:bg-neutral-50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
            <Headset className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-semibold text-neutral-900 ${bengali ? 'font-bengali' : ''}`}>
              {t('chats.support')}
            </span>
            <span className={`block truncate text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
              {t('chats.supportTagline')}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
        </Link>

        {loading ? (
          <p className={`px-4 py-8 text-center text-sm text-neutral-400 ${bengali ? 'font-bengali' : ''}`}>
            {t('misc.loading')}
          </p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className={`text-sm font-medium text-neutral-600 ${bengali ? 'font-bengali' : ''}`}>
              {t('chats.empty')}
            </p>
            <p className={`mt-1 text-xs text-neutral-400 ${bengali ? 'font-bengali' : ''}`}>
              {t('chats.emptySub')}
            </p>
          </div>
        ) : (
          filtered.map((row) => (
            <Link
              key={row.id}
              to="/bookings/$bookingId"
              params={{ bookingId: row.id }}
              className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-neutral-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <UserRound className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold text-neutral-900 ${bengali ? 'font-bengali' : ''}`}>
                  {row.providerName}
                </span>
                <span className={`block truncate text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
                  {t('chats.bookingRef')} {row.reference} · {row.preferred_date}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
            </Link>
          ))
        )}
      </div>
    </PageContainer>
  );
}
