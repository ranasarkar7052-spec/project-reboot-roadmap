import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { FormField, Input, AlertMessage, PageContainer, PageHeader } from '@/components/ui/app-form';
import { validateEmail, validateRequired, validateMinLength, validateIndianPhone, getErrorMessage } from '@/lib/validation';
import { Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { GoogleButton } from './GoogleButton';

export function RegisterPage() {
  const { t, lang } = useI18n();
  const { signUp } = useAuth();
  const bengali = lang === 'bn';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [preferredLang, setPreferredLang] = useState<'en' | 'bn'>(lang);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const newErrors: Record<string, string | null> = {};

    if (!validateRequired(fullName)) newErrors.fullName = getErrorMessage('required', lang);
    if (!validateEmail(email)) newErrors.email = getErrorMessage('email', lang);
    if (!validateIndianPhone(phone)) newErrors.phone = getErrorMessage('phone', lang);
    if (!validateRequired(village)) newErrors.village = getErrorMessage('required', lang);
    if (!validateMinLength(password, 6)) newErrors.password = getErrorMessage('password', lang);
    if (password !== confirmPassword) newErrors.confirmPassword = getErrorMessage('passwordMismatch', lang);

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    const { error } = await signUp(email, password, {
      full_name: fullName,
      phone,
      village,
      preferred_language: preferredLang,
    });
    setLoading(false);

    if (error) {
      if (error.toLowerCase().includes('already') || error.toLowerCase().includes('exists')) {
        setAuthError(t('auth.userExists'));
      } else {
        setAuthError(`${t('auth.signUpFailed')} (${error})`);
      }
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <PageContainer>
        <div className="card flex flex-col items-center p-8 text-center animate-fade-in-up">
          <AlertMessage type="success" title={t('auth.signUpSuccess')} message={t('auth.checkEmail')} />
          <a href="/login" className={`mt-6 btn-primary ${bengali ? 'font-bengali' : ''}`}>
            {t('auth.signIn')}
          </a>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('auth.registerTitle')}
        subtitle={t('auth.registerSubtitle')}
        backTo="/"
      />

      {authError && (
        <div className="mb-4">
          <AlertMessage type="error" message={authError} />
        </div>
      )}

      <GoogleButton />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t('auth.fullName')} required error={errors.fullName}>
          <Input
            value={fullName}
            onChange={setFullName}
            placeholder={bengali ? 'আপনার নাম' : 'Your full name'}
            error={errors.fullName}
            icon={<User className="h-5 w-5" />}
          />
        </FormField>

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

        <FormField label={t('auth.phone')} required error={errors.phone}>
          <Input
            value={phone}
            onChange={setPhone}
            placeholder="9876543210"
            type="tel"
            error={errors.phone}
            icon={<Phone className="h-5 w-5" />}
          />
        </FormField>

        <FormField label={t('auth.village')} required error={errors.village}>
          <Input
            value={village}
            onChange={setVillage}
            placeholder={bengali ? 'গ্রাম / এলাকা' : 'Village / Locality'}
            error={errors.village}
            icon={<MapPin className="h-5 w-5" />}
          />
        </FormField>

        <FormField label={t('auth.preferredLanguage')} required>
          <div className="grid grid-cols-2 gap-2">
            {(['en', 'bn'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setPreferredLang(l)}
                className={`rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  preferredLang === l
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                } ${l === 'bn' ? 'font-bengali' : ''}`}
              >
                {t(`auth.lang.${l}`)}
              </button>
            ))}
          </div>
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

        <FormField label={t('auth.confirmPassword')} required error={errors.confirmPassword}>
          <Input
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            type="password"
            error={errors.confirmPassword}
            icon={<Lock className="h-5 w-5" />}
          />
        </FormField>

        <button
          type="submit"
          disabled={loading}
          className={`btn-primary w-full ${bengali ? 'font-bengali' : ''}`}
        >
          {loading ? t('auth.registering') : t('auth.signUp')}
        </button>
      </form>

      <p className={`mt-6 text-center text-sm text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
        {t('auth.hasAccount')}{' '}
        <a href="/login" className={`font-semibold text-primary-600 hover:text-primary-700 ${bengali ? 'font-bengali' : ''}`}>
          {t('auth.loginHere')}
        </a>
      </p>
    </PageContainer>
  );
}
