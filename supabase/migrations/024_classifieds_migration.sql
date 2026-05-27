-- 024_classifieds_migration.sql

-- 1. Drop order-related triggers and functions
DROP TRIGGER IF EXISTS on_order_completed ON orders;
DROP FUNCTION IF EXISTS mark_listing_sold();

-- 2. Drop orders table
DROP TABLE IF EXISTS orders CASCADE;

-- 3. ALTER reviews: drop order_id column (if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'order_id') THEN
    ALTER TABLE reviews DROP COLUMN order_id CASCADE;
  END IF;
END $$;

-- Add UNIQUE constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_listing_id_reviewer_id_key'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_listing_id_reviewer_id_key UNIQUE(listing_id, reviewer_id);
  END IF;
END $$;

-- 4. Recreate reviews INSERT RLS policy
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id 
    AND EXISTS (
      SELECT 1 FROM listings 
      WHERE id = listing_id 
        AND user_id != auth.uid() 
        AND moderation_status = 'approved'
    )
  );

-- 5. Clean up notifications
DELETE FROM notifications 
WHERE type IN (
  'order_created', 'order_paid', 'order_delivered', 'order_completed', 
  'order_cancelled', 'order_disputed', 'dispute_resolved'
);

-- 6. ALTER listings: add sold_at column and trigger
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION update_listing_sold_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_sold = true AND (OLD.is_sold = false OR OLD.is_sold IS NULL) THEN
    NEW.sold_at = NOW();
  ELSIF NEW.is_sold = false AND OLD.is_sold = true THEN
    NEW.sold_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_listing_sold_at ON listings;
CREATE TRIGGER trigger_update_listing_sold_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_listing_sold_at();

-- Note: admin_logs actions related to orders are obsolete now.
