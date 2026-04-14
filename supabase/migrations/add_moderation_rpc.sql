-- ============================================
-- Migration: Transactional moderation
-- ============================================

CREATE OR REPLACE FUNCTION public.moderate_listing_transaction(
  p_listing_id UUID, p_status TEXT, p_note TEXT, p_admin_id UUID
) RETURNS json AS $$
DECLARE
  v_listing json;
BEGIN
  -- Validate
  IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  -- Update listing
  UPDATE public.listings 
  SET moderation_status = p_status, 
      moderation_note = p_note, 
      moderated_at = NOW(), 
      moderated_by = p_admin_id 
  WHERE id = p_listing_id
  RETURNING row_to_json(listings.*) INTO v_listing;
  
  IF v_listing IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Insert log
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details) 
  VALUES (
    p_admin_id, 
    CASE WHEN p_status = 'approved' THEN 'APPROVE_LISTING' ELSE 'REJECT_LISTING' END, 
    'LISTING', 
    p_listing_id, 
    jsonb_build_object('moderation_note', p_note)
  );
  
  RETURN v_listing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
