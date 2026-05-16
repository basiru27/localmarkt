-- ============================================
-- Migration: Update category names & seed data
-- Schema unchanged — only data mutations
-- Safe to re-run (uses UPDATE, ON CONFLICT)
-- ============================================

-- 1. Rename existing categories (preserves FK references)
UPDATE categories SET name = 'Electronics & Phones' WHERE name = 'Electronics';
UPDATE categories SET name = 'Clothing & Apparel' WHERE name = 'Clothing';
UPDATE categories SET name = 'Food & Groceries' WHERE name = 'Food & Produce';
UPDATE categories SET name = 'Home & Furniture' WHERE name = 'Furniture';

-- 2. Reassign Agriculture listings → Other, then drop Agriculture
UPDATE listings
SET category_id = (SELECT id FROM categories WHERE name = 'Other')
WHERE category_id = (SELECT id FROM categories WHERE name = 'Agriculture');

DELETE FROM categories WHERE name = 'Agriculture';

-- 3. Insert genuinely new categories
INSERT INTO categories (name) VALUES
  ('Beauty & Health'),
  ('Baby & Kids')
ON CONFLICT (name) DO NOTHING;
