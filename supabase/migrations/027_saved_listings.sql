-- Migration 027: Saved listings

CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT saved_listings_unique UNIQUE (user_id, listing_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id
  ON saved_listings (user_id, created_at DESC);

-- Index for fast lookup by listing (e.g., count saves per listing)
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id
  ON saved_listings (listing_id);

-- RLS
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved listings
CREATE POLICY "Users can view own saved listings"
  ON saved_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can save listings
CREATE POLICY "Users can save listings"
  ON saved_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own saved listings
CREATE POLICY "Users can unsave listings"
  ON saved_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
