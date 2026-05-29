-- Migration 030: Fix record_listing_event function
-- The function still referenced viewer_id which was removed in migration 029.
-- This updates it to use user_id and accepts the explicit user_id parameter.
-- Also adds auth.uid() as a fallback when p_user_id is NULL.
-- Must DROP first because PostgreSQL forbids renaming parameters in CREATE OR REPLACE.

DROP FUNCTION IF EXISTS record_listing_event(uuid, event_type, uuid);

CREATE FUNCTION record_listing_event(
  p_listing_id UUID,
  p_event event_type,
  p_user_id UUID DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM listings WHERE id = p_listing_id AND moderation_status = 'approved') THEN
    RETURN;
  END IF;

  INSERT INTO listing_events (listing_id, event, user_id)
  VALUES (p_listing_id, p_event, COALESCE(p_user_id, auth.uid()));

  IF p_event = 'view' THEN
    UPDATE listings SET view_count = view_count + 1 WHERE id = p_listing_id;
  ELSIF p_event = 'contact_click' THEN
    UPDATE listings SET contact_count = contact_count + 1 WHERE id = p_listing_id;
  END IF;
END;
$$;
