-- ============================================
-- Migration: Admin moderation, reports, logs
-- ============================================

-- ============================================
-- PROFILES: role + soft-ban support
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR role NOT IN ('user', 'admin', 'super_admin');

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'admin', 'super_admin'));
  END IF;
END $$;

-- ============================================
-- HELPERS
-- ============================================

CREATE OR REPLACE FUNCTION public.is_platform_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = check_user_id
      AND p.role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only platform admins can change role or ban status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profiles_privileges ON public.profiles;
CREATE TRIGGER protect_profiles_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_changes();

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ============================================
-- LISTINGS: moderation status for approval flow
-- ============================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_note TEXT;

UPDATE public.listings
SET moderation_status = 'approved'
WHERE moderation_status IS NULL;

ALTER TABLE public.listings
  ALTER COLUMN moderation_status SET NOT NULL,
  ALTER COLUMN moderation_status SET DEFAULT 'approved';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_moderation_status_check'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_moderation_status_check
      CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'listings_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_moderation_status
  ON public.listings(moderation_status);

CREATE INDEX IF NOT EXISTS idx_listings_user_moderation_status
  ON public.listings(user_id, moderation_status);

DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by everyone"
  ON public.listings
  FOR SELECT
  USING (
    moderation_status = 'approved'
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = listings.user_id
        AND p.is_banned = TRUE
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND moderation_status = 'pending'
  );

-- ============================================
-- REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reports_status_check CHECK (status IN ('pending', 'resolved', 'dismissed')),
  CONSTRAINT reports_target_check CHECK (listing_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_reporter_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_reporter_id_profiles_fkey
      FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_reported_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_reported_user_id_profiles_fkey
      FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_listing_id ON public.reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Prevent duplicate pending reports from same user for same listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_pending_listing
  ON public.reports (reporter_id, listing_id)
  WHERE listing_id IS NOT NULL AND status = 'pending';

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Users can view own reports or admins can view all" ON public.reports;
CREATE POLICY "Users can view own reports or admins can view all"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports"
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ADMIN LOGS TABLE (append-only audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'admin_logs_admin_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.admin_logs
      ADD CONSTRAINT admin_logs_admin_id_profiles_fkey
      FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view admin logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert admin logs" ON public.admin_logs;
CREATE POLICY "Admins can insert admin logs"
  ON public.admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()) AND admin_id = auth.uid());

-- ============================================
-- NOTES
-- 1) Promote your first super admin manually:
--    UPDATE public.profiles SET role = 'super_admin' WHERE id = '<user-uuid>';
-- 2) New listings should be created with moderation_status='pending' in API.
-- ============================================
