-- Migration 027: Track user_id in listing_events for review gating
-- Also updates record_listing_event to populate user_id

ALTER TABLE listing_events
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_listing_events_user_listing
  ON listing_events (user_id, listing_id, event);

-- Update the RPC to also store user_id
CREATE OR REPLACE FUNCTION record_listing_event(p_listing_id UUID, p_event event_type, p_viewer_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM listings WHERE id = p_listing_id AND moderation_status = 'approved') THEN
    RETURN;
  END IF;

  INSERT INTO listing_events (listing_id, event, user_id)
  VALUES (p_listing_id, p_event, p_viewer_id);

  IF p_event = 'view' THEN
    UPDATE listings SET view_count = view_count + 1 WHERE id = p_listing_id;
  ELSIF p_event = 'contact_click' THEN
    UPDATE listings SET contact_count = contact_count + 1 WHERE id = p_listing_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
