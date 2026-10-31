import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { FormField, Input, AlertMessage, PageContainer, PageHeader } from '@/components/ui/app-form';
import { validateMinLength, getErrorMessage } from '@/lib/validation';

export function ResetPasswordPage() {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const nav = useNavigate();
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady('ok');
    });
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setReady((r) => (r === 'ok' || data.session ? 'ok' : 'invalid'));
    }, 1500);
    return () => {
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const next: Record<string, string | null> = {};
    if (!validateMinLength(password, 6)) next.password = getErrorMessage('password', lang);
    if (password !== confirm) next.confirm = t('auth.passwordsMismatch');
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => nav({ to: '/my-bookings' }), 1200);
  }

  return (
    <PageContainer>
      <PageHeader title={t('auth.newPasswordTitle')} subtitle={t('auth.newPasswordSubtitle')} backTo="/login" />
      {ready === 'invalid' && <AlertMessage type="error" message={t('auth.resetLinkInvalid')} />}
      {done && <AlertMessage type="success" message={t('auth.passwordUpdated')} />}
      {ready === 'ok' && !done && (
        <>
          {error && (
            <div className="mb-4">
              <AlertMessage type="error" message={error} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('auth.newPassword')} required error={errors.password}>
              <Input value={password} onChange={setPassword} type="password" placeholder="••••••••" error={errors.password} icon={<Lock className="h-5 w-5" />} />
            </FormField>
            <FormField label={t('auth.confirmPassword')} required error={errors.confirm}>
              <Input value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" error={errors.confirm} icon={<Lock className="h-5 w-5" />} />
            </FormField>
            <button type="submit" disabled={loading} className={`btn-primary w-full ${bengali ? 'font-bengali' : ''}`}>
              {loading ? t('auth.saving') : t('auth.savePassword')}
            </button>
          </form>
        </>
      )}
    </PageContainer>
  );
}
