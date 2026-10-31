import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { FormField, Input, AlertMessage, PageContainer, PageHeader } from '@/components/ui/app-form';
import { validateEmail, validateMinLength, getErrorMessage } from '@/lib/validation';
import { Mail, Lock } from 'lucide-react';
import { GoogleButton } from './GoogleButton';

export function LoginPage({ defaultTo, title, subtitle, hideRegister }: { defaultTo?: string; title?: string; subtitle?: string; hideRegister?: boolean } = {}) {
  const { t, lang } = useI18n();
  const { signIn } = useAuth();
  const { navigate } = useRouter();
  const nav = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const bengali = lang === 'bn';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const newErrors: Record<string, string | null> = {};

    if (!validateEmail(email)) {
      newErrors.email = getErrorMessage('email', lang);
    }
    if (!validateMinLength(password, 6)) {
      newErrors.password = getErrorMessage('password', lang);
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setAuthError(t('auth.signInFailed'));
      return;
    }
    const target = search.redirect;
    if (target && target.startsWith('/') && !target.startsWith('//')) {
      nav({ href: target });
    } else if (defaultTo) {
      nav({ href: defaultTo });
    } else {
      navigate({ name: 'my-bookings' });
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={title ?? t('auth.loginTitle')}
        subtitle={subtitle ?? t('auth.loginSubtitle')}
        backTo="/"
      />

      <div className="mb-4">
        <AlertMessage type="info" message={t('auth.returningUser')} />
      </div>

      {authError && (
        <div className="mb-4">
          <AlertMessage type="error" message={authError} />
        </div>
      )}

      <GoogleButton />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t('auth.email')} required error={errors.email}>
          <Input
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
            error={errors.email}
            icon={<Mail className="h-5 w-5" />}
          />
        </FormField>

        <FormField label={t('auth.password')} required error={errors.password}>
          <Input
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            type="password"
            error={errors.password}
            icon={<Lock className="h-5 w-5" />}
          />
        </FormField>

        <div className="flex justify-end">
          <a
            href="/forgot-password"
            className={`text-sm font-medium text-primary-600 hover:text-primary-700 ${bengali ? 'font-bengali' : ''}`}
          >
            {t('auth.forgotPassword')}
          </a>
        </div>


        <button
          type="submit"
          disabled={loading}
          className={`btn-primary w-full ${bengali ? 'font-bengali' : ''}`}
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      {!hideRegister && <p className={`mt-6 text-center text-sm text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
        {t('auth.noAccount')}{' '}
        <a
          href="/register"
          className={`font-semibold text-primary-600 hover:text-primary-700 ${bengali ? 'font-bengali' : ''}`}
        >
          {t('auth.registerHere')}
        </a>
      </p>}
    </PageContainer>
  );
}
