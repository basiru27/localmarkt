-- ============================================
-- Migration 033: Fix profile trigger to include phone_number
--
-- The previous migration (add_email_to_profiles.sql) replaced the
-- handle_new_user() trigger function but dropped phone_number from
-- the INSERT. Even though add_profile_management_fields.sql later
-- added the phone_number column to profiles, the trigger never
-- populates it from raw_user_meta_data.
--
-- This migration restores phone_number in the trigger.
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill phone_number for existing profiles from auth.users metadata
UPDATE public.profiles p
SET phone_number = u.raw_user_meta_data->>'phone_number'
FROM auth.users u
WHERE p.id = u.id
  AND p.phone_number IS NULL
  AND u.raw_user_meta_data->>'phone_number' IS NOT NULL;
