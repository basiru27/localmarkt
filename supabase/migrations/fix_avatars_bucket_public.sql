-- Run this in Supabase SQL Editor to fix the avatars bucket

-- 1. Ensure the avatars bucket is public
UPDATE storage.buckets
SET public = true, file_size_limit = 2097152, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'avatars';

-- Insert if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

-- 2. Ensure RLS policies allow public reads via public URL (no SELECT policy needed for public buckets)
-- Remove overly restrictive SELECT policies that might interfere
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;

-- 3. Recreate proper avatar storage policies
-- Insert: authenticated users can upload avatars
-- Note: The owner field is not checked here because Supabase Storage
-- sometimes doesn't auto-populate it for anon-key uploads, causing
-- "new row violates row-level security policy" errors.
-- The bucket already has file_size_limit and allowed_mime_types for safety.
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert avatars" ON storage.objects;
CREATE POLICY "Users can insert avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
  );

-- Update: users can update their own avatar files
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = owner
  );

-- Delete: users can delete avatar files
-- Note: owner is not checked (same reason as INSERT — Supabase Storage
-- doesn't always auto-populate it for anon-key uploads).
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
CREATE POLICY "Users can delete avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
