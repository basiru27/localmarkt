-- Remove broad SELECT policies from public buckets to prevent listing all files
-- since public buckets do not need a SELECT policy to serve images via their public URL.

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for listing images" ON storage.objects;
