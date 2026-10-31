CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'customer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  village text NOT NULL DEFAULT '',
  preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','bn')),
  address_line text NOT NULL DEFAULT '',
  post_office text NOT NULL DEFAULT '',
  pin_code text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'West Bengal',
  landmark text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Roles: read own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Roles: admin read all" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: read own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Profiles: admin read all" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, village, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'village', ''),
    CASE WHEN NEW.raw_user_meta_data->>'preferred_language' = 'bn' THEN 'bn' ELSE 'en' END
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.claim_first_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT false $$;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.admin_exists() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_bn text NOT NULL,
  desc_en text NOT NULL DEFAULT '',
  desc_bn text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'Wrench',
  starting_price integer NOT NULL DEFAULT 0 CHECK (starting_price >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories: public read active" ON public.service_categories FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Categories: admin write" ON public.service_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.service_categories (slug, name_en, name_bn, desc_en, desc_bn, icon_name, starting_price, sort_order) VALUES
  ('electrician', 'Electrician', 'ইলেকট্রিশিয়ান', 'Wiring, switches, lights, fans and general electrical repair.', 'তার, সুইচ, আলো, পাখা ও সাধারণ বৈদ্যুতিক মেরামত।', 'Zap', 150, 1),
  ('plumber', 'Plumber', 'প্লাম্বার', 'Leaks, taps, pipes, drainage and bathroom fittings.', 'লিক, টোকা, পাইপ, নিষ্কাশন ও বাথরুম ফিটিং।', 'Droplets', 120, 2),
  ('pump', 'Water Pump Repair', 'ওয়াটার পাম্প মেরামত', 'Submersible, surface and irrigation pump repair and servicing.', 'সাবমার্সিবল, সারফেস ও সেচ পাম্প মেরামত এবং সার্ভিসিং।', 'Wrench', 250, 3),
  ('appliance', 'Appliance Repair', 'অ্যাপ্লায়েন্স মেরামত', 'Fans, mixers, water purifiers and household appliance repair.', 'পাখা, মিক্সার, ওয়াটার পিউরিফায়ার ও গৃহস্থালি মেরামত।', 'Refrigerator', 200, 4),
  ('agri', 'Agricultural Equipment Repair', 'কৃষি সরঞ্জাম মেরামত', 'Tractors, sprayers, threshers and farm machinery repair.', 'ট্রাক্টর, স্প্রেয়ার, থ্রেসার ও কৃষি যন্ত্র মেরামত।', 'Tractor', 300, 5);

CREATE TABLE public.provider_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_ids uuid[] NOT NULL DEFAULT '{}',
  service_areas text[] NOT NULL DEFAULT '{}',
  experience_years integer NOT NULL DEFAULT 0 CHECK (experience_years BETWEEN 0 AND 70),
  qualification_details text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  working_hours text NOT NULL DEFAULT '',
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  verification_note text NOT NULL DEFAULT '',
  verified_at timestamptz,
  verified_by uuid,
  consent_given boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  contact_number text NOT NULL DEFAULT '',
  reverification_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consent_required CHECK (consent_given)
);
GRANT SELECT, INSERT, UPDATE ON public.provider_profiles TO authenticated;
GRANT ALL ON public.provider_profiles TO service_role;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_provider_profiles_updated BEFORE UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Providers: read own" ON public.provider_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Providers: admin read" ON public.provider_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers: insert own" ON public.provider_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Providers: update own" ON public.provider_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Providers: admin update" ON public.provider_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.normalize_phone(_p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT right(regexp_replace(COALESCE(_p, ''), '\D', '', 'g'), 10)
$$;

CREATE OR REPLACE FUNCTION public.guard_provider_profile()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE changed jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'pending';
    NEW.verification_note := '';
    NEW.verified_at := NULL; NEW.verified_by := NULL;
    NEW.reverification_changes := '{}'::jsonb;
    NEW.consent_at := COALESCE(NEW.consent_at, now());
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'provider') ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') AND current_setting('localfix.reverify', true) IS DISTINCT FROM 'on' THEN
    RETURN NEW;
  END IF;
  NEW.verification_status := OLD.verification_status;
  NEW.verification_note := OLD.verification_note;
  NEW.verified_at := OLD.verified_at; NEW.verified_by := OLD.verified_by;
  NEW.reverification_changes := OLD.reverification_changes;

  IF current_setting('localfix.reverify', true) = 'on' THEN
    changed := COALESCE(NULLIF(current_setting('localfix.reverify_changes', true), '')::jsonb, '{}'::jsonb);
  END IF;
  IF public.normalize_phone(NEW.contact_number) IS DISTINCT FROM public.normalize_phone(OLD.contact_number) THEN changed := changed || jsonb_build_object('contact_number', OLD.contact_number); END IF;
  IF NEW.category_ids IS DISTINCT FROM OLD.category_ids THEN changed := changed || jsonb_build_object('category_ids', to_jsonb(OLD.category_ids)); END IF;
  IF NEW.service_areas IS DISTINCT FROM OLD.service_areas THEN changed := changed || jsonb_build_object('service_areas', to_jsonb(OLD.service_areas)); END IF;
  IF NEW.qualification_details IS DISTINCT FROM OLD.qualification_details THEN changed := changed || jsonb_build_object('qualification_details', OLD.qualification_details); END IF;
  IF NEW.experience_years IS DISTINCT FROM OLD.experience_years THEN changed := changed || jsonb_build_object('experience_years', OLD.experience_years); END IF;

  IF OLD.verification_status = 'approved' AND changed <> '{}'::jsonb THEN
    NEW.verification_status := 'pending';
    NEW.verification_note := 'Re-verification: profile details changed';
    NEW.verified_at := NULL;
    NEW.reverification_changes := changed || OLD.reverification_changes;
  ELSIF OLD.verification_status = 'pending' AND OLD.reverification_changes <> '{}'::jsonb AND changed <> '{}'::jsonb THEN
    NEW.reverification_changes := changed || OLD.reverification_changes;
  ELSIF OLD.verification_status = 'rejected' AND (changed <> '{}'::jsonb OR NEW.photo_url IS DISTINCT FROM OLD.photo_url) THEN
    NEW.verification_status := 'pending';
    NEW.verification_note := 'Resubmitted after rejection';
    NEW.reverification_changes := changed || OLD.reverification_changes;
  END IF;
  RETURN NEW;
END; $function$;
CREATE TRIGGER trg_guard_provider BEFORE INSERT OR UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.guard_provider_profile();

CREATE OR REPLACE FUNCTION public.reverify_on_profile_change()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE changed jsonb := '{}'::jsonb;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN changed := changed || jsonb_build_object('full_name', OLD.full_name); END IF;
  IF public.normalize_phone(NEW.phone) IS DISTINCT FROM public.normalize_phone(OLD.phone) THEN changed := changed || jsonb_build_object('phone', OLD.phone); END IF;
  IF NEW.village IS DISTINCT FROM OLD.village THEN changed := changed || jsonb_build_object('village', OLD.village); END IF;
  IF changed = '{}'::jsonb THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = NEW.id AND verification_status IN ('approved','rejected')
             OR (id = NEW.id AND verification_status = 'pending' AND reverification_changes <> '{}'::jsonb)) THEN
    PERFORM set_config('localfix.reverify', 'on', true);
    PERFORM set_config('localfix.reverify_changes', changed::text, true);
    UPDATE public.provider_profiles SET updated_at = now() WHERE id = NEW.id;
    PERFORM set_config('localfix.reverify', 'off', true);
    PERFORM set_config('localfix.reverify_changes', '', true);
  END IF;
  RETURN NEW;
END; $function$;
CREATE TRIGGER trg_reverify_on_profile_change AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.reverify_on_profile_change();

CREATE OR REPLACE FUNCTION public.list_approved_providers()
RETURNS TABLE (id uuid, full_name text, village text, category_ids uuid[], service_areas text[], experience_years integer, qualification_details text, photo_url text, is_available boolean, working_hours text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, pr.full_name, pr.village, p.category_ids, p.service_areas, p.experience_years, p.qualification_details, p.photo_url, p.is_available, p.working_hours
  FROM public.provider_profiles p JOIN public.profiles pr ON pr.id = p.id
  WHERE p.verification_status = 'approved'
  ORDER BY p.is_available DESC, p.experience_years DESC
$$;
GRANT EXECUTE ON FUNCTION public.list_approved_providers() TO anon, authenticated;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL DEFAULT ('LF-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES public.service_categories(id),
  description text NOT NULL CHECK (char_length(description) BETWEEN 5 AND 1000),
  village text NOT NULL CHECK (char_length(village) BETWEEN 1 AND 100),
  address text NOT NULL CHECK (char_length(address) BETWEEN 1 AND 300),
  landmark text NOT NULL DEFAULT '',
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  photo_url text NOT NULL DEFAULT '',
  contact_preference text NOT NULL DEFAULT 'either' CHECK (contact_preference IN ('call','whatsapp','either')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','on_the_way','in_progress','completed','rejected','cancelled')),
  cancel_reason text NOT NULL DEFAULT '',
  agreed_amount integer CHECK (agreed_amount IS NULL OR agreed_amount >= 0),
  amount_confirmed boolean NOT NULL DEFAULT false,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX bookings_no_duplicate_active ON public.bookings (customer_id, category_id, preferred_date)
  WHERE status IN ('requested','accepted','on_the_way','in_progress');
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.provider_serves_category(_uid uuid, _cat uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = _uid AND verification_status = 'approved' AND _cat = ANY(category_ids))
$$;

CREATE POLICY "Bookings: customer read" ON public.bookings FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Bookings: provider read assigned" ON public.bookings FOR SELECT TO authenticated USING (provider_id = auth.uid());
CREATE POLICY "Bookings: provider read open" ON public.bookings FOR SELECT TO authenticated USING (provider_id IS NULL AND status = 'requested' AND public.provider_serves_category(auth.uid(), category_id));
CREATE POLICY "Bookings: admin read" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Bookings: customer insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (
  customer_id = auth.uid() AND status = 'requested' AND agreed_amount IS NULL AND amount_confirmed = false
  AND (provider_id IS NULL OR public.provider_serves_category(provider_id, category_id))
);

CREATE OR REPLACE FUNCTION public.validate_booking_insert() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.preferred_date < current_date THEN RAISE EXCEPTION 'Preferred date cannot be in the past'; END IF;
  IF NEW.preferred_date > current_date + 90 THEN RAISE EXCEPTION 'Preferred date too far in future'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_booking_insert BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.validate_booking_insert();

CREATE TABLE public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_status_history TO authenticated;
GRANT ALL ON public.booking_status_history TO service_role;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "History: parties read" ON public.booking_status_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.customer_id = auth.uid() OR b.provider_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications: read own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Notifications: update own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE OR REPLACE FUNCTION public.admin_review_provider(_provider_id uuid, _approve boolean, _note text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE prev text; reason text := trim(COALESCE(_note, ''));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _provider_id = auth.uid() THEN RAISE EXCEPTION 'You cannot review your own provider profile'; END IF;
  SELECT verification_status INTO prev FROM public.provider_profiles WHERE id = _provider_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Provider not found'; END IF;
  IF _approve AND prev = 'approved' THEN RAISE EXCEPTION 'This provider is already approved'; END IF;
  IF NOT _approve AND prev = 'rejected' THEN RAISE EXCEPTION 'This provider is already rejected'; END IF;
  IF NOT _approve AND char_length(reason) < 3 THEN RAISE EXCEPTION 'A reason for rejection is required'; END IF;
  UPDATE public.provider_profiles SET
    verification_status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    verification_note = left(reason, 500),
    verified_at = CASE WHEN _approve THEN now() ELSE NULL END,
    verified_by = auth.uid(),
    reverification_changes = CASE WHEN _approve THEN '{}'::jsonb ELSE reverification_changes END
  WHERE id = _provider_id;
  INSERT INTO public.notifications (user_id, type, title, message) VALUES (
    _provider_id,
    CASE WHEN _approve THEN 'provider_approved' WHEN prev = 'approved' THEN 'provider_approval_revoked' ELSE 'provider_rejected' END,
    CASE WHEN _approve THEN 'Profile approved' WHEN prev = 'approved' THEN 'Approval withdrawn' ELSE 'Profile not approved' END,
    CASE WHEN _approve THEN 'You can now receive booking requests.' ELSE 'Reason: ' || left(reason, 500) END);
END; $function$;

CREATE TABLE public.commission_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_percentage numeric(5,2) NOT NULL CHECK (rate_percentage >= 0 AND rate_percentage <= 50),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.commission_policies TO authenticated;
GRANT ALL ON public.commission_policies TO service_role;
ALTER TABLE public.commission_policies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_commission_policies_updated BEFORE UPDATE ON public.commission_policies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Policies: admin all" ON public.commission_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.commission_policies (rate_percentage, is_active) VALUES (10, true);

CREATE TABLE public.commission_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  policy_id uuid REFERENCES public.commission_policies(id),
  agreed_amount integer NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'calculated' CHECK (status IN ('calculated','adjusted','refunded')),
  adjustment_note text NOT NULL DEFAULT '',
  adjusted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.commission_records TO authenticated;
GRANT ALL ON public.commission_records TO service_role;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_commission_records_updated BEFORE UPDATE ON public.commission_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Commission: admin read" ON public.commission_records FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Commission: admin update" ON public.commission_records FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Commission: provider read own" ON public.commission_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.provider_id = auth.uid()));

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  complainant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 150),
  description text NOT NULL CHECK (char_length(description) BETWEEN 5 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  resolution_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Complaints: read own" ON public.complaints FOR SELECT TO authenticated USING (complainant_id = auth.uid());
CREATE POLICY "Complaints: insert own on own booking" ON public.complaints FOR INSERT TO authenticated WITH CHECK (
  complainant_id = auth.uid() AND status = 'open'
  AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.customer_id = auth.uid() OR b.provider_id = auth.uid())));
CREATE POLICY "Complaints: admin read" ON public.complaints FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Complaints: admin update" ON public.complaints FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.notify_on_booking_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.booking_status_history (booking_id, status, changed_by) VALUES (NEW.id, NEW.status, NEW.customer_id);
  IF NEW.provider_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, booking_id, type, title, message)
    VALUES (NEW.provider_id, NEW.id, 'booking_requested', 'New booking request', 'Booking ' || NEW.reference || ' for ' || to_char(NEW.preferred_date, 'DD Mon YYYY'));
  ELSE
    INSERT INTO public.notifications (user_id, booking_id, type, title, message)
    SELECT p.id, NEW.id, 'booking_requested', 'New booking request nearby', 'Booking ' || NEW.reference || ' is open for any provider'
    FROM public.provider_profiles p WHERE p.verification_status = 'approved' AND NEW.category_id = ANY(p.category_ids);
  END IF;
  INSERT INTO public.notifications (user_id, booking_id, type, title, message)
  VALUES (NEW.customer_id, NEW.id, 'booking_created', 'Booking request sent', 'Your booking ' || NEW.reference || ' has been sent.');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_booking_insert AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_insert();

CREATE OR REPLACE FUNCTION public.update_booking_status(_booking_id uuid, _status text, _reason text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings; uid uuid := auth.uid(); is_admin boolean; is_cust boolean; is_prov boolean; is_assigned boolean; ok boolean := false;
  pol public.commission_policies;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  is_admin := public.has_role(uid, 'admin');
  is_cust := b.customer_id = uid;
  is_assigned := b.provider_id = uid;
  is_prov := is_assigned OR (b.provider_id IS NULL AND public.provider_serves_category(uid, b.category_id));

  IF b.status = 'requested' AND _status = 'accepted' AND is_prov THEN ok := true;
  ELSIF b.status = 'requested' AND _status = 'rejected' AND is_assigned THEN ok := true;
  ELSIF b.status = 'accepted' AND _status = 'on_the_way' AND is_assigned THEN ok := true;
  ELSIF b.status = 'on_the_way' AND _status = 'in_progress' AND is_assigned THEN ok := true;
  ELSIF b.status = 'in_progress' AND _status = 'completed' AND is_assigned THEN ok := true;
  ELSIF b.status IN ('requested','accepted','on_the_way') AND _status = 'cancelled' AND (is_cust OR is_assigned OR is_admin) THEN ok := true;
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'Invalid status change from % to %', b.status, _status; END IF;
  IF _status IN ('cancelled','rejected') AND char_length(trim(COALESCE(_reason,''))) < 3 THEN RAISE EXCEPTION 'A reason is required'; END IF;
  IF _status = 'completed' AND (b.agreed_amount IS NULL OR NOT b.amount_confirmed) THEN
    RAISE EXCEPTION 'The customer must confirm the agreed price before the job is completed';
  END IF;

  UPDATE public.bookings SET
    status = _status,
    cancel_reason = CASE WHEN _status IN ('cancelled','rejected') THEN left(COALESCE(_reason,''), 500) ELSE cancel_reason END,
    provider_id = CASE WHEN _status = 'accepted' AND provider_id IS NULL THEN uid ELSE provider_id END
  WHERE id = _booking_id RETURNING * INTO b;

  INSERT INTO public.booking_status_history (booking_id, status, changed_by, reason) VALUES (b.id, _status, uid, COALESCE(_reason,''));

  IF uid = b.customer_id THEN
    IF b.provider_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, booking_id, type, title, message)
      VALUES (b.provider_id, b.id, 'booking_' || _status, 'Booking ' || b.reference || ': ' || replace(_status,'_',' '), b.reference || COALESCE(' — ' || NULLIF(_reason,''), ''));
    END IF;
  ELSE
    INSERT INTO public.notifications (user_id, booking_id, type, title, message)
    VALUES (b.customer_id, b.id, 'booking_' || _status, 'Booking ' || b.reference || ': ' || replace(_status,'_',' '), b.reference || COALESCE(' — ' || NULLIF(_reason,''), ''));
  END IF;

  IF _status = 'completed' AND b.agreed_amount IS NOT NULL AND b.amount_confirmed THEN
    SELECT * INTO pol FROM public.commission_policies WHERE is_active ORDER BY created_at DESC LIMIT 1;
    IF FOUND THEN
      INSERT INTO public.commission_records (booking_id, policy_id, agreed_amount, commission_rate, commission_amount)
      VALUES (b.id, pol.id, b.agreed_amount, pol.rate_percentage, round(b.agreed_amount * pol.rate_percentage / 100, 2))
      ON CONFLICT (booking_id) DO NOTHING;
    END IF;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.set_booking_amount(_booking_id uuid, _amount integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR b.provider_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF b.status NOT IN ('accepted','on_the_way','in_progress') THEN RAISE EXCEPTION 'Amount can only be set on active bookings'; END IF;
  IF _amount < 0 OR _amount > 1000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  UPDATE public.bookings SET agreed_amount = _amount, amount_confirmed = false WHERE id = _booking_id;
  INSERT INTO public.notifications (user_id, booking_id, type, title, message)
  VALUES (b.customer_id, b.id, 'amount_proposed', 'Price proposed for ' || b.reference, '₹' || _amount || ' — please confirm.');
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_booking_amount(_booking_id uuid, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR b.customer_id <> auth.uid() OR b.agreed_amount IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF b.status NOT IN ('accepted','on_the_way','in_progress') THEN RAISE EXCEPTION 'The price can only be confirmed on an active booking'; END IF;
  IF _accept THEN UPDATE public.bookings SET amount_confirmed = true WHERE id = _booking_id;
  ELSE UPDATE public.bookings SET agreed_amount = NULL, amount_confirmed = false WHERE id = _booking_id; END IF;
  IF b.provider_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, booking_id, type, title, message)
    VALUES (b.provider_id, b.id, CASE WHEN _accept THEN 'amount_confirmed' ELSE 'amount_rejected' END,
      CASE WHEN _accept THEN 'Price confirmed for ' ELSE 'Price declined for ' END || b.reference, '');
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.get_booking_party_names(_booking_ids uuid[])
RETURNS TABLE (booking_id uuid, customer_name text, provider_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, c.full_name, p.full_name FROM public.bookings b
  JOIN public.profiles c ON c.id = b.customer_id
  LEFT JOIN public.profiles p ON p.id = b.provider_id
  WHERE b.id = ANY(_booking_ids)
    AND (b.customer_id = auth.uid() OR b.provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
         OR (b.provider_id IS NULL AND b.status = 'requested' AND public.provider_serves_category(auth.uid(), b.category_id)))
$$;

CREATE OR REPLACE FUNCTION public.get_booking_contact(_booking_id uuid)
 RETURNS TABLE(name text, phone text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF NOT FOUND OR b.status NOT IN ('accepted','on_the_way','in_progress') OR b.provider_id IS NULL THEN RETURN; END IF;
  IF auth.uid() = b.customer_id THEN
    RETURN QUERY SELECT pr.full_name, NULLIF(pp.contact_number,'') FROM public.profiles pr JOIN public.provider_profiles pp ON pp.id = pr.id WHERE pr.id = b.provider_id;
  ELSIF auth.uid() = b.provider_id THEN
    RETURN QUERY SELECT pr.full_name, pr.phone FROM public.profiles pr WHERE pr.id = b.customer_id;
  END IF;
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_set_commission_rate(_rate numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _rate < 0 OR _rate > 50 THEN RAISE EXCEPTION 'Rate must be between 0 and 50'; END IF;
  UPDATE public.commission_policies SET is_active = false WHERE is_active;
  INSERT INTO public.commission_policies (rate_percentage, is_active, created_by) VALUES (_rate, true, auth.uid());
END; $$;

CREATE FUNCTION public.admin_list_providers()
 RETURNS TABLE(id uuid, full_name text, village text, phone text, contact_number text, category_ids uuid[], service_areas text[], experience_years integer, qualification_details text, photo_url text, verification_status text, verification_note text, consent_given boolean, consent_at timestamp with time zone, created_at timestamp with time zone, reverification_changes jsonb)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT p.id, pr.full_name, pr.village, pr.phone, p.contact_number, p.category_ids, p.service_areas, p.experience_years, p.qualification_details, p.photo_url, p.verification_status, p.verification_note, p.consent_given, p.consent_at, p.created_at, p.reverification_changes
  FROM public.provider_profiles p JOIN public.profiles pr ON pr.id = p.id ORDER BY p.created_at DESC;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.update_booking_status(uuid, text, text), public.set_booking_amount(uuid, integer), public.confirm_booking_amount(uuid, boolean), public.get_booking_contact(uuid), public.get_booking_party_names(uuid[]), public.admin_review_provider(uuid, boolean, text), public.admin_set_commission_rate(numeric), public.admin_list_providers() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_booking_status(uuid, text, text), public.set_booking_amount(uuid, integer), public.confirm_booking_amount(uuid, boolean), public.get_booking_contact(uuid), public.get_booking_party_names(uuid[]), public.admin_review_provider(uuid, boolean, text), public.admin_set_commission_rate(numeric), public.admin_list_providers(), public.admin_exists() TO authenticated;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  provider_id uuid NOT NULL REFERENCES public.profiles(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews: parties and admin read" ON public.reviews FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR provider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Reviews: customer insert on own completed booking" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid()
      AND b.provider_id = reviews.provider_id AND b.status = 'completed'));

CREATE OR REPLACE FUNCTION public.provider_ratings()
RETURNS TABLE(provider_id uuid, avg_rating numeric, review_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.provider_id, round(avg(r.rating)::numeric, 1), count(*) FROM public.reviews r
  JOIN public.provider_profiles p ON p.id = r.provider_id AND p.verification_status = 'approved'
  GROUP BY r.provider_id
$$;
GRANT EXECUTE ON FUNCTION public.provider_ratings() TO anon, authenticated;

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  table_name text NOT NULL,
  record_id text NOT NULL DEFAULT '',
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit: admin read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec jsonb; old_rec jsonb;
BEGIN
  rec := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  old_rec := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  IF TG_TABLE_NAME = 'provider_profiles' AND TG_OP = 'UPDATE' THEN
    IF (rec->>'verification_status') IS NOT DISTINCT FROM (old_rec->>'verification_status') THEN
      RETURN NEW;
    END IF;
  END IF;
  IF TG_TABLE_NAME = 'bookings' THEN
    IF TG_OP <> 'UPDATE' OR (rec->>'status') IS NOT DISTINCT FROM (old_rec->>'status')
       OR NOT public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
  END IF;
  INSERT INTO public.audit_log (actor_id, table_name, record_id, action, details)
  VALUES (auth.uid(), TG_TABLE_NAME, COALESCE(rec->>'id', old_rec->>'id', ''), TG_OP,
          jsonb_build_object('new', rec, 'old', old_rec));
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER audit_commission_policies AFTER INSERT OR UPDATE OR DELETE ON public.commission_policies FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_service_categories AFTER INSERT OR UPDATE OR DELETE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_commission_records AFTER UPDATE ON public.commission_records FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_provider_verification AFTER UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_admin_booking_status AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_complaints AFTER UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE UPDATE, DELETE ON public.bookings FROM authenticated;

CREATE OR REPLACE FUNCTION public.admin_grant_admin(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can add admins'; END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'No account found with that email. Ask them to sign up first.'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.admin_grant_admin(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_admin(text) TO authenticated;