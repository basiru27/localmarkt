-- ============================================
-- Migration: Add notification preferences JSONB column
-- ============================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{"email_contact": true, "email_moderation": true, "email_sales": true}'::jsonb;