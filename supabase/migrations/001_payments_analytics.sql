-- 1. order_status and event_type ENUMs
CREATE TYPE order_status AS ENUM ('pending', 'buyer_paid', 'completed', 'cancelled', 'disputed');
CREATE TYPE event_type AS ENUM ('view', 'contact_click');

-- 2. orders table with all columns
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  price_at_purchase NUMERIC NOT NULL CHECK (price_at_purchase >= 0),
  payment_method TEXT DEFAULT 'mobile_money',
  payment_reference TEXT,
  seller_note TEXT,
  dispute_reason TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status order_status NOT NULL DEFAULT 'pending',
  buyer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" 
  ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers create orders" 
  ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Note: Column-level and transition rules are enforced strictly in Express middleware.

-- 4. updated_at trigger for orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Partial unique index
CREATE UNIQUE INDEX one_active_order_per_listing ON orders(listing_id) WHERE status IN ('pending', 'buyer_paid');

-- 6. listing_events table with RLS policy
CREATE TABLE IF NOT EXISTS listing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  event event_type NOT NULL,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_events_listing_time ON listing_events(listing_id, created_at DESC);

ALTER TABLE listing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own listing events"
  ON listing_events FOR SELECT 
  USING (listing_id IN (SELECT id FROM listings WHERE user_id = auth.uid()));

-- 7. view_count and contact_count columns on listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

-- 8. record_listing_event RPC
CREATE OR REPLACE FUNCTION record_listing_event(p_listing_id UUID, p_event event_type, p_viewer_id UUID)
RETURNS void AS $$
BEGIN
  -- Adjusted to use moderation_status='approved' since 'status' doesn't exist on listings
  IF NOT EXISTS (SELECT 1 FROM listings WHERE id = p_listing_id AND moderation_status = 'approved') THEN
    RETURN;
  END IF;
  
  INSERT INTO listing_events (listing_id, event, viewer_id) 
  VALUES (p_listing_id, p_event, p_viewer_id);
  
  IF p_event = 'view' THEN
    UPDATE listings SET view_count = view_count + 1 WHERE id = p_listing_id;
  ELSIF p_event = 'contact_click' THEN
    UPDATE listings SET contact_count = contact_count + 1 WHERE id = p_listing_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. get_seller_daily_views RPC
CREATE OR REPLACE FUNCTION get_seller_daily_views(p_seller_id UUID, p_days INT)
RETURNS TABLE(day DATE, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT date_trunc('day', le.created_at)::DATE AS day, COUNT(*) AS view_count
  FROM listing_events le
  JOIN listings l ON le.listing_id = l.id
  WHERE l.user_id = p_seller_id
    AND le.event = 'view'
    AND le.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY 1 ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. verified_seller boolean column on profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT false;
