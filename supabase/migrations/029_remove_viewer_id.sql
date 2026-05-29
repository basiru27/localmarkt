-- Migration 029: Remove duplicate viewer_id column from listing_events
-- user_id is the canonical column (added in migration 027)
-- viewer_id is a duplicate with identical values

-- Copy any viewer_id values to user_id where user_id is null (data safety)
UPDATE listing_events
SET user_id = viewer_id
WHERE user_id IS NULL AND viewer_id IS NOT NULL;

-- Drop the duplicate column
ALTER TABLE listing_events DROP COLUMN IF EXISTS viewer_id;
