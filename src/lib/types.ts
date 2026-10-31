import type { LucideIcon } from 'lucide-react';

export type CategoryId =
  | 'electrician'
  | 'plumber'
  | 'pump'
  | 'appliance'
  | 'agri';

export interface ServiceCategory {
  /** Category slug (matches service_categories.slug). */
  id: string;
  /** Database id, present when loaded from the backend. */
  dbId?: string;
  /** Localised name/description from the backend; falls back to i18n keys. */
  title?: string;
  desc?: string;
  icon: LucideIcon;
  color: string;
  bgGradient: string;
  startingPrice: number;
  workerCount: number;
  popularTags: string[];
}

export interface Worker {
  id: string;
  name: string;
  nameBn: string;
  category: string;
  area: string;
  areaBn: string;
  experienceYears: number;
  jobsCompleted: number;
  visitFee: number;
  availableToday: boolean;
  /** Average rating; null when the provider has no reviews yet. */
  rating: number | null;
  /** Number of reviews, shown instead of jobsCompleted when set. */
  reviewCount?: number;
}
