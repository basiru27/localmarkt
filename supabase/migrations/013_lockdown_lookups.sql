-- Add explicit RLS write policies for regions and categories tables to block non-admins
-- Only users with the super_admin role can modify these lookup tables

-- 1. Zones Table
CREATE POLICY "Super admins can insert zones"
ON zones FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can update zones"
ON zones FOR UPDATE
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can delete zones"
ON zones FOR DELETE
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- 2. Areas Table
CREATE POLICY "Super admins can insert areas"
ON areas FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can update areas"
ON areas FOR UPDATE
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can delete areas"
ON areas FOR DELETE
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- 3. Categories Table
CREATE POLICY "Super admins can insert categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can update categories"
ON categories FOR UPDATE
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can delete categories"
ON categories FOR DELETE
TO authenticated
USING (public.is_platform_admin(auth.uid()));

