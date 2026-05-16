-- ============================================
-- Migration: Replace regions with zones + areas (GBA)
-- Greater Banjul Area zone/area lookup system
-- ============================================

-- 1. Create zones table
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

-- 2. Create areas table
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

-- 3. Seed zones and areas (Greater Banjul Area only)
INSERT INTO zones (name) VALUES
  ('Banjul'),
  ('Serrekunda'),
  ('Bakau / Fajara'),
  ('Kololi / Kotu'),
  ('Sukuta / Brikama'),
  ('Brufut / Tanji')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  banjul_id INT; serrekunda_id INT; bakau_id INT;
  kololi_id INT; sukuta_id INT; brufut_id INT;
BEGIN
  SELECT id INTO banjul_id FROM zones WHERE name = 'Banjul';
  SELECT id INTO serrekunda_id FROM zones WHERE name = 'Serrekunda';
  SELECT id INTO bakau_id FROM zones WHERE name = 'Bakau / Fajara';
  SELECT id INTO kololi_id FROM zones WHERE name = 'Kololi / Kotu';
  SELECT id INTO sukuta_id FROM zones WHERE name = 'Sukuta / Brikama';
  SELECT id INTO brufut_id FROM zones WHERE name = 'Brufut / Tanji';

  -- Banjul
  INSERT INTO areas (name, zone_id) VALUES ('Banjul', banjul_id), ('Jeshwang', banjul_id), ('Westfield', banjul_id)
  ON CONFLICT (name, zone_id) DO NOTHING;

  -- Serrekunda
  INSERT INTO areas (name, zone_id) VALUES
    ('Serrekunda', serrekunda_id), ('Kanifing', serrekunda_id), ('Latrikunda German', serrekunda_id),
    ('Dippa Kunda', serrekunda_id), ('Bundung', serrekunda_id), ('Latrikunda Sabiji', serrekunda_id),
    ('Tabokoto', serrekunda_id), ('Sinchu', serrekunda_id)
  ON CONFLICT (name, zone_id) DO NOTHING;

  -- Bakau / Fajara
  INSERT INTO areas (name, zone_id) VALUES
    ('Bakau', bakau_id), ('Fajara', bakau_id), ('Pipeline', bakau_id),     ('Cape Point', bakau_id)
  ON CONFLICT (name, zone_id) DO NOTHING;

  -- Kololi / Kotu
  INSERT INTO areas (name, zone_id) VALUES
    ('Kololi', kololi_id), ('Kotu', kololi_id), ('Bijilo', kololi_id),
    ('Kerr Serign', kololi_id),     ('Senegambia', kololi_id)
  ON CONFLICT (name, zone_id) DO NOTHING;

  -- Sukuta / Brikama
  INSERT INTO areas (name, zone_id) VALUES
    ('Sukuta', sukuta_id), ('Brikama', sukuta_id), ('Yundum', sukuta_id),     ('Busumbala', sukuta_id)
  ON CONFLICT (name, zone_id) DO NOTHING;

  -- Brufut / Tanji
  INSERT INTO areas (name, zone_id) VALUES ('Brufut', brufut_id), ('Tanji', brufut_id)
  ON CONFLICT (name, zone_id) DO NOTHING;
END $$;

-- 4. Alter listings: drop region_id, add area_id
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_region_id_fkey;
DROP INDEX IF EXISTS idx_listings_region_id;

ALTER TABLE listings DROP COLUMN IF EXISTS region_id;

ALTER TABLE listings ADD COLUMN area_id INTEGER REFERENCES areas(id);

CREATE INDEX IF NOT EXISTS idx_listings_area_id ON listings(area_id);

-- 5. Drop old regions table (no longer referenced)
DROP TABLE IF EXISTS regions CASCADE;
