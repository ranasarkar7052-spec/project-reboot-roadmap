import { useI18n } from '@/lib/i18n';
import { Wrench } from 'lucide-react';

export function Footer() {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';

  const links = [
    { label: t('footer.about'), href: '#' },
    { label: t('footer.contact'), href: '#' },
    { label: t('footer.privacy'), href: '#' },
    { label: t('footer.terms'), href: '#' },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Wrench className="h-5 w-5" />
              </div>
              <span className={`text-lg font-bold text-neutral-900 ${bengali ? 'font-bengali' : ''}`}>
                LocalFix
              </span>
            </div>
            <p className={`mt-3 text-sm leading-relaxed text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
              {t('brand.tagline')}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium text-neutral-500 transition-colors hover:text-primary-700 ${bengali ? 'font-bengali' : ''}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-6">
          <p className={`text-xs text-neutral-400 ${bengali ? 'font-bengali' : ''}`}>
            © {new Date().getFullYear()} {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
