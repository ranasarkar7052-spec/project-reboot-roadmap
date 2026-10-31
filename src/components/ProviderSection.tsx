import { Briefcase, CheckCircle2, ArrowRight, ArrowRightCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function ProviderSection() {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';

  const benefits = [
    t('provider.benefit1'),
    t('provider.benefit2'),
    t('provider.benefit3'),
    t('provider.benefit4'),
  ];

  return (
    <section id="providers" className="bg-neutral-50 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-in-up">
            <span className={`inline-flex items-center gap-2 rounded-full bg-primary-100 px-3.5 py-1.5 text-sm font-medium text-primary-700 ${bengali ? 'font-bengali' : ''}`}>
              <Briefcase className="h-4 w-4" />
              {t('nav.becomeProvider')}
            </span>
            <h2 className={`mt-4 text-2xl font-bold text-neutral-900 sm:text-3xl ${bengali ? 'font-bengali' : ''}`}>
              {t('provider.title')}
            </h2>
            <p className={`mt-2 text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
              {t('provider.subtitle')}
            </p>

            <ul className="mt-6 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" />
                  <span className={`text-sm text-neutral-700 sm:text-base ${bengali ? 'font-bengali' : ''}`}>
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="/provider-register" className={`btn-primary ${bengali ? 'font-bengali' : ''}`}>
                {t('provider.apply')}
                <ArrowRight className="h-4 w-4" />
              </a>
              <button className={`btn-secondary ${bengali ? 'font-bengali' : ''}`}>
                {t('provider.learn')}
              </button>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="overflow-hidden rounded-3xl shadow-card-hover">
              <img
                src="https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Repair worker"
                className="h-[360px] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white p-4 shadow-card-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100">
                  <ArrowRightCircle className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-neutral-900">₹0</p>
                  <p className={`text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>
                    {bengali ? 'যোগ দিতে ফ্রি' : 'Free to join'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
