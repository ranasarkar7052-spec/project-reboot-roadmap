import { useState } from 'react';
import { lovable } from '@/integrations/lovable/index';
import { useI18n } from '@/lib/i18n';

export function GoogleButton() {
  const { lang } = useI18n();
  const bn = lang === 'bn';
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setErr(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    setBusy(false);
    if (result.error) { setErr(bn ? 'Google দিয়ে সাইন ইন ব্যর্থ হয়েছে' : 'Google sign-in failed'); return; }
    if (result.redirected) return;
    window.location.href = '/';
  }

  return (
    <div className="mb-4">
      <button type="button" onClick={go} disabled={busy} className={`btn-secondary w-full ${bn ? 'font-bengali' : ''}`}>
        {bn ? 'Google দিয়ে চালিয়ে যান' : 'Continue with Google'}
      </button>
      {err && <p className="mt-2 text-sm text-error-600">{err}</p>}
      <p className={`mt-4 text-center text-sm text-neutral-500 ${bn ? 'font-bengali' : ''}`}>{bn ? 'অথবা ইমেল দিয়ে' : 'or continue with email'}</p>
    </div>
  );
}
