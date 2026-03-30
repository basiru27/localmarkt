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

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- REGIONS TABLE (Lookup)
-- ============================================
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Enable RLS on regions
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Regions policy - public read
CREATE POLICY "Regions are viewable by everyone"
  ON regions FOR SELECT
  USING (true);

-- Seed regions with official Gambian regions
INSERT INTO regions (name) VALUES
  ('Banjul'),
  ('Kanifing'),
  ('Brikama'),
  ('Kerewan'),
  ('Kuntaur'),
  ('Janjanbureh'),
  ('Basse')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- CATEGORIES TABLE (Lookup)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policy - public read
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Seed categories
INSERT INTO categories (name) VALUES
  ('Electronics'),
  ('Clothing'),
  ('Food & Produce'),
  ('Furniture'),
  ('Vehicles'),
  ('Services'),
  ('Agriculture'),
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
  region_id INTEGER REFERENCES regions(id),
  category_id INTEGER REFERENCES categories(id),
  contact TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_region_id ON listings(region_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Enable RLS on listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LISTINGS RLS POLICIES
-- ============================================

-- SELECT: Anyone can view listings (public)
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (true);

-- INSERT: Only authenticated users can create listings
CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only the owner can update their listings
CREATE POLICY "Users can update their own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only the owner can delete their listings
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
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
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
-- STORAGE BUCKET SETUP (Run separately in Supabase Dashboard)
-- ============================================
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called 'listing-images'
-- 3. Set it to Public
-- 4. Add the following policies:
--
-- Policy 1: Allow public read access
--   - Name: "Public read access"
--   - Allowed operations: SELECT
--   - Target roles: public
--   - Policy definition: true
--
-- Policy 2: Allow authenticated users to upload
--   - Name: "Authenticated users can upload"
--   - Allowed operations: INSERT
--   - Target roles: authenticated
--   - Policy definition: true
--
-- Policy 3: Allow users to update/delete their uploads
--   - Name: "Users can manage their uploads"
--   - Allowed operations: UPDATE, DELETE
--   - Target roles: authenticated
--   - Policy definition: (auth.uid()::text = (storage.foldername(name))[1])
--
-- Note: Structure uploads as: {user_id}/{filename}

-- ============================================
-- VERIFICATION QUERIES (Run to verify setup)
-- ============================================
-- SELECT * FROM regions;
-- SELECT * FROM categories;
-- SELECT COUNT(*) FROM listings;
