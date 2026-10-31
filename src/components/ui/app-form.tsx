import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n';
import { AlertCircle, Info, CheckCircle2, X } from 'lucide-react';

export function FormField({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string | null;
  children: ReactNode;
  required?: boolean;
}) {
  const { lang } = useI18n();
  const bengali = lang === 'bn';

  return (
    <div>
      <label className={`mb-1.5 block text-sm font-semibold text-neutral-700 ${bengali ? 'font-bengali' : ''}`}>
        {label}
        {required && <span className="ml-0.5 text-error-500">*</span>}
      </label>
      {children}
      {error && (
        <p className={`mt-1 flex items-center gap-1 text-xs text-error-600 ${bengali ? 'font-bengali' : ''}`}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  disabled,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | null;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const { lang } = useI18n();
  const bengali = lang === 'bn';

  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border-0 bg-white py-3.5 ${icon ? 'pl-10' : 'pl-4'} pr-4 text-base text-neutral-800 shadow-card ring-1 ring-inset transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? 'ring-error-300 focus:ring-error-500' : 'ring-neutral-200 focus:ring-primary-500'
        } ${bengali ? 'font-bengali' : ''}`}
      />
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string | null;
}) {
  const { lang } = useI18n();
  const bengali = lang === 'bn';

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-xl border-0 bg-white px-4 py-3 text-base text-neutral-800 shadow-card ring-1 ring-inset transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
        error ? 'ring-error-300 focus:ring-error-500' : 'ring-neutral-200 focus:ring-primary-500'
      } ${bengali ? 'font-bengali' : ''}`}
    />
  );
}

export function AlertMessage({
  type,
  title,
  message,
  onClose,
}: {
  type: 'info' | 'success' | 'error' | 'warning';
  title?: string;
  message: string;
  onClose?: () => void;
}) {
  const { lang } = useI18n();
  const bengali = lang === 'bn';

  const configs = {
    info: { bg: 'bg-primary-50', ring: 'ring-primary-200', icon: Info, iconColor: 'text-primary-600' },
    success: { bg: 'bg-success-50', ring: 'ring-success-200', icon: CheckCircle2, iconColor: 'text-success-600' },
    error: { bg: 'bg-error-50', ring: 'ring-error-200', icon: AlertCircle, iconColor: 'text-error-600' },
    warning: { bg: 'bg-warning-50', ring: 'ring-warning-200', icon: AlertCircle, iconColor: 'text-warning-600' },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl ${config.bg} p-4 ring-1 ${config.ring}`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
      <div className="flex-1">
        {title && (
          <p className={`text-sm font-semibold text-neutral-800 ${bengali ? 'font-bengali' : ''}`}>{title}</p>
        )}
        <p className={`text-sm text-neutral-600 ${bengali ? 'font-bengali' : ''}`}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-600">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  backTo,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
}) {
  const { lang } = useI18n();
  const bengali = lang === 'bn';

  return (
    <div className="mb-6">
      {backTo && (
        <a
          href={backTo}
          className={`mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 ${bengali ? 'font-bengali' : ''}`}
        >
          ← {bengali ? 'পিছনে' : 'Back'}
        </a>
      )}
      <h1 className={`text-2xl font-bold text-neutral-900 sm:text-3xl ${bengali ? 'font-bengali' : ''}`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`mt-2 text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>{subtitle}</p>
      )}
    </div>
  );
}
