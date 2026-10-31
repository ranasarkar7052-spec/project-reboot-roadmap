import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { FormField, Input, AlertMessage, PageContainer, PageHeader } from '@/components/ui/app-form';
import { validateEmail, getErrorMessage } from '@/lib/validation';

export function ForgotPasswordPage() {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateEmail(email)) {
      setFieldError(getErrorMessage('email', lang));
      return;
    }
    setFieldError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(t('auth.resetFailed'));
      return;
    }
    setSent(true);
  }

  return (
    <PageContainer>
      <PageHeader title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} backTo="/login" />
      {sent ? (
        <AlertMessage type="success" message={t('auth.resetLinkSent')} />
      ) : (
        <>
          {error && (
            <div className="mb-4">
              <AlertMessage type="error" message={error} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('auth.email')} required error={fieldError}>
              <Input
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
                error={fieldError}
                icon={<Mail className="h-5 w-5" />}
              />
            </FormField>
            <button type="submit" disabled={loading} className={`btn-primary w-full ${bengali ? 'font-bengali' : ''}`}>
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
          </form>
        </>
      )}
    </PageContainer>
  );
}
