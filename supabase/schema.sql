-- ============================================
-- Gambia Marketplace Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies (drop if exists to allow re-running)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- ZONES TABLE (Lookup - Greater Banjul Area)
-- ============================================
CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Enable RLS on zones
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Zones policy - public read
DROP POLICY IF EXISTS "Zones are viewable by everyone" ON zones;
CREATE POLICY "Zones are viewable by everyone"
  ON zones FOR SELECT
  USING (true);

-- ============================================
-- AREAS TABLE (Lookup - GBA neighbourhoods)
-- ============================================
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  zone_id INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  UNIQUE(name, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_areas_zone_id ON areas(zone_id);

-- Enable RLS on areas
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Areas policy - public read
DROP POLICY IF EXISTS "Areas are viewable by everyone" ON areas;
CREATE POLICY "Areas are viewable by everyone"
  ON areas FOR SELECT
  USING (true);

-- Seed zones with Greater Banjul Area zones
INSERT INTO zones (name) VALUES
  ('Banjul'),
  ('Serrekunda'),
  ('Bakau / Fajara'),
  ('Kololi / Kotu'),
  ('Sukuta / Brikama'),
  ('Brufut / Tanji')
ON CONFLICT (name) DO NOTHING;

-- Seed areas
INSERT INTO areas (name, zone_id) VALUES
  -- Banjul
  ('Banjul', (SELECT id FROM zones WHERE name = 'Banjul')),
  ('Jeshwang', (SELECT id FROM zones WHERE name = 'Banjul')),
  ('Westfield', (SELECT id FROM zones WHERE name = 'Banjul')),
  -- Serrekunda
  ('Serrekunda', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  ('Kanifing', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  ('Latrikunda German', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  ('Dippa Kunda', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  ('Bundung', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  ('Latrikunda Sabiji', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  ('Tabokoto', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  ('Sinchu', (SELECT id FROM zones WHERE name = 'Serrekunda')),
  -- Bakau / Fajara
  ('Bakau', (SELECT id FROM zones WHERE name = 'Bakau / Fajara')),
  ('Fajara', (SELECT id FROM zones WHERE name = 'Bakau / Fajara')),
  ('Pipeline', (SELECT id FROM zones WHERE name = 'Bakau / Fajara')),
  ('Cape Point', (SELECT id FROM zones WHERE name = 'Bakau / Fajara')),
  -- Kololi / Kotu
  ('Kololi', (SELECT id FROM zones WHERE name = 'Kololi / Kotu')),
  ('Kotu', (SELECT id FROM zones WHERE name = 'Kololi / Kotu')),
  ('Bijilo', (SELECT id FROM zones WHERE name = 'Kololi / Kotu')),
  ('Kerr Serign', (SELECT id FROM zones WHERE name = 'Kololi / Kotu')),
  ('Senegambia', (SELECT id FROM zones WHERE name = 'Kololi / Kotu')),
  -- Sukuta / Brikama
  ('Sukuta', (SELECT id FROM zones WHERE name = 'Sukuta / Brikama')),
  ('Brikama', (SELECT id FROM zones WHERE name = 'Sukuta / Brikama')),
  ('Yundum', (SELECT id FROM zones WHERE name = 'Sukuta / Brikama')),
  ('Busumbala', (SELECT id FROM zones WHERE name = 'Sukuta / Brikama')),
  -- Brufut / Tanji
  ('Brufut', (SELECT id FROM zones WHERE name = 'Brufut / Tanji')),
  ('Tanji', (SELECT id FROM zones WHERE name = 'Brufut / Tanji'))
ON CONFLICT (name, zone_id) DO NOTHING;

-- ============================================
-- CATEGORIES TABLE (Lookup)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policy - public read (drop if exists to allow re-running)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Seed categories
INSERT INTO categories (name) VALUES
  ('Electronics & Phones'),
  ('Clothing & Apparel'),
  ('Home & Furniture'),
  ('Beauty & Health'),
  ('Food & Groceries'),
  ('Baby & Kids'),
  ('Vehicles'),
  ('Services'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used_like_new', 'used_good', 'used_fair')),
  area_id INTEGER REFERENCES areas(id),
  category_id INTEGER REFERENCES categories(id),
  contact TEXT NOT NULL,
  image_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMPTZ,
  bumped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_area_id ON listings(area_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_bumped_at ON listings(bumped_at DESC NULLS LAST);

-- Enable RLS on listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LISTINGS RLS POLICIES (drop if exists to allow re-running)
-- ============================================

-- SELECT: Anyone can view listings (public)
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (true);

-- INSERT: Only authenticated users can create listings
DROP POLICY IF EXISTS "Authenticated users can create listings" ON listings;
CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only the owner can update their listings
DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
CREATE POLICY "Users can update their own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only the owner can delete their listings
DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;
CREATE POLICY "Users can delete their own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Auto-set sold_at when is_sold changes
-- ============================================
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

-- ============================================
-- SAVED LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT saved_listings_unique UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id
  ON saved_listings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id
  ON saved_listings (listing_id);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved listings" ON saved_listings;
CREATE POLICY "Users can view own saved listings"
  ON saved_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save listings" ON saved_listings;
CREATE POLICY "Users can save listings"
  ON saved_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave listings" ON saved_listings;
CREATE POLICY "Users can unsave listings"
  ON saved_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKET SETUP
-- Run this section to create the storage bucket and policies
-- ============================================

-- Create the listing-images bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Storage policies for listing-images bucket

-- Policy 1: Allow users to view their own images (Required for upload API to return success)
DROP POLICY IF EXISTS "Users can view their own listing images" ON storage.objects;
CREATE POLICY "Users can view their own listing images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to update their own images
DROP POLICY IF EXISTS "Users can update their own listing images" ON storage.objects;
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own images
DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICATION QUERIES (Run to verify setup)
-- ============================================
-- SELECT * FROM zones;
-- SELECT * FROM areas;
-- SELECT * FROM categories;
-- SELECT COUNT(*) FROM listings;
-- SELECT * FROM storage.buckets WHERE id = 'listing-images';
