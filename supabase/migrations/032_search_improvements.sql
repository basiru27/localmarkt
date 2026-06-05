-- ============================================
-- Migration: Search Improvements — FTS + Trigram
-- ============================================

-- Add full-text search vector column with weighted fields
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS listings_search_vector_idx 
ON listings USING GIN(search_vector);

-- Trigram extension for fuzzy/partial matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index on title for typo-tolerant searches
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx 
ON listings USING GIN(title gin_trgm_ops);

-- Trigger to keep search_vector updated on title/description changes
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listing_search_vector ON listings;
CREATE TRIGGER trg_listing_search_vector
  BEFORE INSERT OR UPDATE OF title, description ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_search_vector();
