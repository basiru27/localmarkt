-- ============================================
-- Migration: Add Full Text Search (FTS) to Listings
-- ============================================

-- Add tsvector column
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || coalesce(description, ''))) STORED;

-- Add GIN index
CREATE INDEX IF NOT EXISTS listings_fts_idx ON public.listings USING GIN (fts);
