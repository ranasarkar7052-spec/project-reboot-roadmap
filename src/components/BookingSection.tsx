import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, Clock, FileText, Info, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatRupees } from '@/lib/data';
import type { ServiceCategory, Worker } from '@/lib/types';

interface BookingSectionProps {
  /** Live categories and approved providers (see useHomeData). */
  categories: ServiceCategory[];
  workers: Worker[];
  selectedCategory: string | null;
  onCategorySelect: (id: string) => void;
  initialWorker?: Worker | null;
}

const timeSlots = ['09:00', '11:00', '14:00', '16:00', '18:00'];

export function BookingSection({
  categories,
  workers,
  selectedCategory,
  onCategorySelect,
  initialWorker,
}: BookingSectionProps) {
  const { t, lang } = useI18n();
  const bengali = lang === 'bn';
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(initialWorker ?? null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [description, setDescription] = useState('');
  /** null = no choice yet, 'any' = open request to every approved provider. */
  const [anyProvider, setAnyProvider] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialWorker) { setSelectedWorker(initialWorker); setAnyProvider(false); }
  }, [initialWorker]);

  const availableWorkers = selectedCategory
    ? workers.filter((w) => w.category === selectedCategory)
    : [];

  const today = new Date();
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return {
      // Local calendar date (toISOString would shift to UTC and can pick the wrong day in IST).
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  });

  const canSubmit = selectedCategory && (selectedWorker || anyProvider) && selectedDate && selectedTime;

  // Hands the choices to the real booking page, which collects the address and saves the booking.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedCategory) return;
    navigate({
      to: '/booking',
      search: {
        category: selectedCategory,
        provider: anyProvider ? undefined : selectedWorker?.id,
        date: selectedDate,
        time: selectedTime.slice(0, 2),
        note: description.trim().slice(0, 1000) || undefined,
      },
    });
  }

  return (
    <section id="booking" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold text-neutral-900 sm:text-3xl ${bengali ? 'font-bengali' : ''}`}>
            {t('booking.title')}
          </h2>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-warning-50 px-4 py-2.5 ring-1 ring-warning-200">
          <Info className="h-4 w-4 shrink-0 text-warning-600" />
          <p className={`text-xs text-warning-800 ${bengali ? 'font-bengali' : ''}`}>
            {t('booking.continueHint')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Category */}
          <div>
            <label className={`mb-2.5 block text-sm font-semibold text-neutral-700 ${bengali ? 'font-bengali' : ''}`}>
              {t('booking.chooseCategory')}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onCategorySelect(cat.id);
                      setSelectedWorker(null);
                      setAnyProvider(false);
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className={`text-xs font-medium ${bengali ? 'font-bengali' : ''}`}>
                      {cat.title ?? t(`cat.${cat.id}.title`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Worker */}
          {selectedCategory && (
            <div className="animate-fade-in">
              <label className={`mb-2.5 block text-sm font-semibold text-neutral-700 ${bengali ? 'font-bengali' : ''}`}>
                {t('booking.selectWorker')}
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setAnyProvider(true); setSelectedWorker(null); }}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    anyProvider ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold text-neutral-800 ${bengali ? 'font-bengali' : ''}`}>{t('booking.anyProvider')}</p>
                    <p className={`truncate text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>{t('booking.anyProviderDesc')}</p>
                  </div>
                </button>
                {availableWorkers.map((w) => {
                  const isActive = selectedWorker?.id === w.id;
                  const name = bengali ? w.nameBn : w.name;
                  const area = bengali ? w.areaBn : w.area;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => { setSelectedWorker(w); setAnyProvider(false); }}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        isActive
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                        {name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold text-neutral-800 ${bengali ? 'font-bengali' : ''}`}>{name}</p>
                        <p className={`truncate text-xs text-neutral-500 ${bengali ? 'font-bengali' : ''}`}>{area}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-medium text-neutral-600 ${bengali ? 'font-bengali' : ''}`}>
                        {formatRupees(w.visitFee)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date */}
          {(selectedWorker || anyProvider) && (
            <div className="animate-fade-in">
              <label className={`mb-2.5 block text-sm font-semibold text-neutral-700 ${bengali ? 'font-bengali' : ''}`}>
                <Calendar className="mr-1.5 inline h-4 w-4" />
                {t('booking.selectDate')}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dateOptions.map((date) => (
                  <button
                    key={date.value}
                    type="button"
                    onClick={() => setSelectedDate(date.value ?? "")}
                    className={`shrink-0 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                      selectedDate === date.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {date.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time */}
          {selectedDate && (
            <div className="animate-fade-in">
              <label className={`mb-2.5 block text-sm font-semibold text-neutral-700 ${bengali ? 'font-bengali' : ''}`}>
                <Clock className="mr-1.5 inline h-4 w-4" />
                {t('booking.selectTime')}
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                      selectedTime === slot
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {selectedTime && (
            <div className="animate-fade-in">
              <label className={`mb-2.5 block text-sm font-semibold text-neutral-700 ${bengali ? 'font-bengali' : ''}`}>
                <FileText className="mr-1.5 inline h-4 w-4" />
                {t('booking.describe')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('booking.describePlaceholder')}
                rows={3}
                className={`w-full rounded-xl border-0 bg-white px-4 py-3 text-base text-neutral-800 shadow-card ring-1 ring-inset ring-neutral-200 transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${bengali ? 'font-bengali' : ''}`}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`btn-primary w-full text-lg ${bengali ? 'font-bengali' : ''}`}
          >
            {t('booking.continueToDetails')}
          </button>
        </form>
      </div>
    </section>
  );
}
