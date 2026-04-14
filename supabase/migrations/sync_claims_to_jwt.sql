-- ============================================
-- Migration: Sync profile role/is_banned to auth.users custom claims (JWT)
-- ============================================

-- Function to handle syncing the claims
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- We only run this if role or is_banned changed
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.is_banned IS DISTINCT FROM OLD.is_banned)) THEN
    
    -- Update the auth.users table's raw_app_meta_data
    -- This ensures the JWT will contain role and is_banned in the app_metadata object
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', NEW.role,
        'is_banned', NEW.is_banned
      )
    WHERE id = NEW.id;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on the profiles table
DROP TRIGGER IF EXISTS on_profile_role_banned_change ON public.profiles;
CREATE TRIGGER on_profile_role_banned_change
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth_claims();

-- Backfill existing profiles into auth.users claims
DO $$
DECLARE
  prof RECORD;
BEGIN
  FOR prof IN SELECT id, role, is_banned FROM public.profiles LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', prof.role,
        'is_banned', prof.is_banned
      )
    WHERE id = prof.id;
  END LOOP;
END;
$$;
