import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder }: SearchBarProps) {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="flex w-full items-stretch gap-2"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? t('hero.searchPlaceholder')}
          className={`w-full rounded-xl border-0 bg-white py-4 pl-12 pr-4 text-base text-neutral-800 shadow-card ring-1 ring-inset ring-neutral-200 transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${bengali ? 'font-bengali' : ''}`}
        />
      </div>
      <button type="submit" className={`btn-primary px-5 sm:px-7 ${bengali ? 'font-bengali' : ''}`}>
        <Search className="h-5 w-5" />
        <span className="hidden sm:inline">{t('hero.searchButton')}</span>
      </button>
    </form>
  );
}
