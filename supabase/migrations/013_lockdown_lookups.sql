-- Add explicit RLS write policies for regions and categories tables to block non-admins
-- Only users with the super_admin role can modify these lookup tables

-- 1. Regions Table
CREATE POLICY "Super admins can insert regions"
ON regions FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can update regions"
ON regions FOR UPDATE
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can delete regions"
ON regions FOR DELETE
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- 2. Categories Table
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

