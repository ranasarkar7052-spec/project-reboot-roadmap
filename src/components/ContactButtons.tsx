import { useState } from 'react';
import { Phone, MessageCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { CONTACT_STATUSES, whatsappLink } from '@/lib/api';
import type { BookingStatus, ContactPreference } from '@/lib/db-types';
import { AlertMessage } from '@/components/ui/app-form';

/**
 * Contact the other party of a booking. The phone number is only released by
 * the server to the customer/provider of an accepted (or later, still active) booking.
 */
export function ContactButtons({
  bookingId,
  reference,
  status,
  preference,
  audience,
}: {
  bookingId: string;
  reference: string;
  status: BookingStatus;
  preference: ContactPreference;
  audience: 'customer' | 'provider';
}) {
  const { t, lang } = useI18n();
  const bn = lang === 'bn' ? 'font-bengali' : '';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!CONTACT_STATUSES.includes(status)) {
    return (
      <p className={`flex items-center gap-1.5 text-xs text-neutral-500 ${bn}`}>
        <Lock className="h-3.5 w-3.5" /> {t('comm.lockedUntilAccepted')}
      </p>
    );
  }

  async function open(kind: 'call' | 'whatsapp') {
    setError(null);
    setBusy(true);
    const { data, error: err } = await supabase.rpc('get_booking_contact', { _booking_id: bookingId });
    setBusy(false);
    const phone = data?.[0]?.phone;
    if (err || !phone) {
      setError(kind === 'call' ? t('comm.callErrorDesc') : t('comm.whatsappErrorDesc'));
      return;
    }
    if (kind === 'call') window.location.href = `tel:${phone}`;
    else window.open(whatsappLink(phone, `LocalFix ${reference}`), '_blank', 'noopener');
  }

  const showCall = preference !== 'whatsapp';
  const showWa = preference !== 'call';
  const callLabel = audience === 'customer' ? t('providerDash.callCustomer') : t('myBookings.callProvider');
  const waLabel = audience === 'customer' ? t('providerDash.whatsappCustomer') : t('myBookings.whatsappProvider');

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {showCall && (
          <button disabled={busy} onClick={() => open('call')} className={`btn-secondary px-4 py-2.5 text-sm ${bn}`}>
            <Phone className="h-4 w-4" /> {callLabel}
          </button>
        )}
        {showWa && (
          <button disabled={busy} onClick={() => open('whatsapp')} className={`btn-secondary px-4 py-2.5 text-sm ${bn}`}>
            <MessageCircle className="h-4 w-4" /> {waLabel}
          </button>
        )}
      </div>
      {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
    </div>
  );
}
