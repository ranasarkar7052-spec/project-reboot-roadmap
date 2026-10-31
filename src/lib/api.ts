import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Booking, BookingStatus, ServiceCategory } from './db-types';
import type { Lang } from './i18n';

export interface ProviderListing {
  id: string;
  full_name: string;
  village: string;
  category_ids: string[];
  service_areas: string[];
  experience_years: number;
  qualification_details: string;
  photo_url: string;
  is_available: boolean;
  working_hours: string;
}

export const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: async (): Promise<ServiceCategory[]> => {
    const { data, error } = await supabase.from('service_categories').select('*').order('sort_order');
    if (error) throw error;
    return data as ServiceCategory[];
  },
  staleTime: 60_000,
});

export const providersQuery = queryOptions({
  queryKey: ['approved-providers'],
  queryFn: async (): Promise<ProviderListing[]> => {
    const { data, error } = await supabase.rpc('list_approved_providers');
    if (error) throw error;
    return (data ?? []) as ProviderListing[];
  },
  staleTime: 30_000,
});

export interface ProviderRating { provider_id: string; avg_rating: number; review_count: number }

export const ratingsQuery = queryOptions({
  queryKey: ['provider-ratings'],
  queryFn: async (): Promise<ProviderRating[]> => {
    const { data, error } = await supabase.rpc('provider_ratings');
    if (error) throw error;
    return (data ?? []).map((r) => ({ provider_id: r.provider_id, avg_rating: Number(r.avg_rating), review_count: Number(r.review_count) }));
  },
  staleTime: 60_000,
});

export function catName(c: ServiceCategory | undefined, lang: Lang) {
  if (!c) return '—';
  return lang === 'bn' ? c.name_bn : c.name_en;
}

export const ACTIVE_STATUSES: BookingStatus[] = ['requested', 'accepted', 'on_the_way', 'in_progress'];
export const CONTACT_STATUSES: BookingStatus[] = ['accepted', 'on_the_way', 'in_progress'];

/** Next status a provider can move a booking to. */
export function providerNextStatus(status: BookingStatus): BookingStatus | null {
  switch (status) {
    case 'accepted': return 'on_the_way';
    case 'on_the_way': return 'in_progress';
    case 'in_progress': return 'completed';
    default: return null;
  }
}

export function canCancel(status: BookingStatus) {
  return status === 'requested' || status === 'accepted' || status === 'on_the_way';
}

export async function attachPartyNames<T extends Booking>(rows: T[]) {
  if (rows.length === 0) return rows.map((r) => ({ ...r, customer_name: '', provider_name: '' }));
  const { data } = await supabase.rpc('get_booking_party_names', { _booking_ids: rows.map((r) => r.id) });
  const map = new Map((data ?? []).map((d) => [d.booking_id, d]));
  return rows.map((r) => ({
    ...r,
    customer_name: map.get(r.id)?.customer_name ?? '',
    provider_name: map.get(r.id)?.provider_name ?? '',
  }));
}

export function friendlyError(message: string | undefined | null) {
  if (!message) return null;
  if (message.includes('bookings_no_duplicate_active')) return 'duplicate';
  return message;
}

/** Build a WhatsApp link for an Indian phone number. */
export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

export function formatDate(d: string, lang: Lang) {
  try {
    return new Date(d).toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}
