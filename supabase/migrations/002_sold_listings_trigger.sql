ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION mark_listing_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE listings SET is_sold = true WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_completed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION mark_listing_sold();
