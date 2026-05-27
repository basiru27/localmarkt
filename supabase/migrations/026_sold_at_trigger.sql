-- Migration 026: Add trigger to auto-set sold_at when is_sold changes
-- Replaces the old 002_sold_listings_trigger.sql which referenced the deleted orders table

CREATE OR REPLACE FUNCTION set_listing_sold_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_sold IS DISTINCT FROM OLD.is_sold THEN
    NEW.sold_at = CASE WHEN NEW.is_sold = true THEN NOW() ELSE NULL END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_listing_sold_at ON listings;
CREATE TRIGGER trigger_set_listing_sold_at
  BEFORE UPDATE OF is_sold ON listings
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_sold_at();
