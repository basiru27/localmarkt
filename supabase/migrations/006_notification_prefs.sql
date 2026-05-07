-- ============================================
-- Migration: Add notifications preferences to profiles
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications JSONB
    DEFAULT '{"email_contact": true, "email_moderation": true, "email_sales": true}'::jsonb;

-- Ensure RLS won't block reads/writes for the profile owner when updating their notification prefs
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
