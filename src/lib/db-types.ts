export type UserRole = 'customer' | 'provider' | 'admin';
export type Lang = 'en' | 'bn';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  village: string;
  address_line?: string;
  post_office?: string;
  pin_code?: string;
  district?: string;
  state?: string;
  landmark?: string;
  preferred_language: Lang;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string;
  desc_en: string;
  desc_bn: string;
  icon_name: string;
  starting_price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ProviderProfile {
  id: string;
  category_ids: string[];
  service_areas: string[];
  experience_years: number;
  qualification_details: string;
  photo_url: string;
  is_available: boolean;
  working_hours: string;
  verification_status: VerificationStatus;
  verification_note: string;
  verified_at: string | null;
  verified_by: string | null;
  consent_given: boolean;
  consent_at: string | null;
  contact_number: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovedProviderView {
  id: string;
  full_name: string;
  village: string;
  category_ids: string[];
  service_areas: string[];
  experience_years: number;
  qualification_details: string;
  photo_url: string;
  is_available: boolean;
  working_hours: string;
  verification_status: VerificationStatus;
  verified_at: string | null;
  consent_given: boolean;
  created_at: string;
}

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ContactPreference = 'call' | 'whatsapp' | 'either';

export interface Booking {
  id: string;
  reference: string;
  customer_id: string;
  provider_id: string | null;
  category_id: string;
  description: string;
  village: string;
  address: string;
  landmark: string;
  preferred_date: string;
  preferred_time: string;
  photo_url: string;
  contact_preference: ContactPreference;
  status: BookingStatus;
  cancel_reason: string;
  agreed_amount: number | null;
  amount_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  category?: ServiceCategory;
  provider_name?: string;
  customer_name?: string;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  status: BookingStatus;
  changed_by: string;
  reason: string;
  created_at: string;
}

export type NotificationType =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_on_the_way'
  | 'booking_in_progress';

export interface Notification {
  id: string;
  user_id: string;
  booking_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CommissionPolicy {
  id: string;
  rate_percentage: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CommissionStatus = 'calculated' | 'adjusted' | 'refunded';

export interface CommissionRecord {
  id: string;
  booking_id: string;
  policy_id: string | null;
  agreed_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: CommissionStatus;
  adjustment_note: string;
  adjusted_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ComplaintStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface Complaint {
  id: string;
  booking_id: string;
  complainant_id: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  resolution_note: string;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}
