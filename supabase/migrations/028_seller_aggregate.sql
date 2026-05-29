-- Migration 028: Seller reputation aggregate function

CREATE OR REPLACE FUNCTION get_seller_profile(p_seller_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  verified_seller BOOLEAN,
  phone_number TEXT,
  member_since TIMESTAMPTZ,
  active_listings BIGINT,
  total_reviews BIGINT,
  avg_rating NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.verified_seller,
    p.phone_number,
    p.created_at AS member_since,
    COUNT(DISTINCT l.id) FILTER (
      WHERE l.moderation_status = 'approved' AND l.is_sold = false
    ) AS active_listings,
    COUNT(r.id) AS total_reviews,
    ROUND(AVG(r.rating)::NUMERIC, 1) AS avg_rating
  FROM profiles p
  LEFT JOIN listings l ON l.user_id = p.id
  LEFT JOIN reviews r ON r.listing_id = l.id
  WHERE p.id = p_seller_id
  GROUP BY p.id;
$$;
