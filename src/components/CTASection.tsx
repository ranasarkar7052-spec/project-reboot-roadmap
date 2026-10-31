import { ArrowRight, Wrench } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function CTASection() {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';

  return (
    <section className="bg-primary-600 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold text-white sm:text-3xl ${bengali ? 'font-bengali' : ''}`}>
              {t('cta.title')}
            </h2>
            <p className={`mt-2 max-w-lg text-primary-50 ${bengali ? 'font-bengali' : ''}`}>
              {t('cta.subtitle')}
            </p>
          </div>
          <a
            href="/booking"
            className={`inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-primary-700 shadow-card-hover transition-all hover:bg-primary-50 active:scale-95 ${bengali ? 'font-bengali' : ''}`}
          >
            {t('cta.button')}
            <ArrowRight className="h-5 w-5" />
          </a>

          <div className="mt-6 max-w-2xl border-t border-white/20 pt-8">
            <h3 className={`text-lg font-semibold text-white ${bengali ? 'font-bengali' : ''}`}>
              {t('cta.providerTitle')}
            </h3>
            <p className={`mt-1.5 text-sm text-primary-50 ${bengali ? 'font-bengali' : ''}`}>
              {t('cta.providerSubtitle')}
            </p>
            <a
              href="#providers"
              className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition-all hover:bg-primary-800 active:scale-95 ${bengali ? 'font-bengali' : ''}`}
            >
              {t('cta.providerButton')}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
