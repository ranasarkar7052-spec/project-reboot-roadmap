import { Moon, Globe } from 'lucide-react';
import { useI18n, type Lang } from '@/lib/i18n';
import { useState, useRef, useEffect } from 'react';

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { value: Lang; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'bn', label: 'বাংলা' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span>{lang === 'en' ? 'EN' : 'বাং'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-xl bg-white shadow-card-hover ring-1 ring-neutral-200 animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setLang(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50 ${
                lang === opt.value
                  ? 'font-semibold text-primary-700 bg-primary-50'
                  : 'text-neutral-600'
              }`}
            >
              {opt.label}
              {lang === opt.value && <span className="ml-auto text-primary-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
