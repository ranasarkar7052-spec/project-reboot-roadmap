import { Search, CalendarCheck, Home, Wallet, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function HowItWorks() {
  const { t, lang } = useI18n();
  const bn = lang === 'bn' ? 'font-bengali' : '';

  const steps = [
    { icon: Search, title: t('how.step1.title'), desc: t('how.step1.desc'), bg: 'bg-primary-600' },
    { icon: CalendarCheck, title: t('how.step2.title'), desc: t('how.step2.desc'), bg: 'bg-success-500' },
    { icon: Home, title: t('how.step3.title'), desc: t('how.step3.desc'), bg: 'bg-accent-500' },
    { icon: Wallet, title: t('how.step4.title'), desc: t('how.step4.desc'), bg: 'bg-primary-400' },
  ];

  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className={`text-lg font-bold text-neutral-900 sm:text-2xl ${bn}`}>{t('home.howWorks')}</h2>
        <p className={`mt-1 text-sm text-neutral-500 ${bn}`}>{t('how.subtitle')}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-soft ${step.bg}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h3 className={`text-sm font-semibold text-neutral-900 ${bn}`}>{i + 1}. {step.title}</h3>
                  <p className={`mt-0.5 text-xs leading-relaxed text-neutral-500 ${bn}`}>{step.desc}</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="mt-3 hidden h-4 w-4 shrink-0 text-neutral-300 lg:block" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
