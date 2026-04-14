-- ============================================
-- Migration: Add RLS protections for listings
-- ============================================

-- Prevent users from updating moderation fields on their own listings
CREATE OR REPLACE FUNCTION public.prevent_listing_moderation_bypass()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
     OR NEW.moderated_at IS DISTINCT FROM OLD.moderated_at
     OR NEW.moderation_note IS DISTINCT FROM OLD.moderation_note THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only platform admins can change moderation status or details';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_listing_moderation ON public.listings;
CREATE TRIGGER protect_listing_moderation
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_listing_moderation_bypass();
