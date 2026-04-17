-- Migration: Add restricted storage SELECT policies
-- This restores the ability for the Supabase Storage client to perform "upsert" checks
-- while still preventing malicious actors from listing the entire bucket.

-- 1. Avatars: Users can SELECT (read/check existence of) their own avatars
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
CREATE POLICY "Users can view their own avatar"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = owner
  );

-- 2. Listing Images: Users can SELECT their own listing images
DROP POLICY IF EXISTS "Users can view their own listing images" ON storage.objects;
CREATE POLICY "Users can view their own listing images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'listing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
