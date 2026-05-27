-- ============================================
-- Migration: Add bumped_at column for listing bump
-- ============================================

ALTER TABLE listings ADD COLUMN IF NOT EXISTS bumped_at TIMESTAMPTZ;

-- Index for sort performance on the browse feed
CREATE INDEX IF NOT EXISTS idx_listings_bumped_at ON listings (bumped_at DESC NULLS LAST);
