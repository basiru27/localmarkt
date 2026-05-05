-- Migration: Set REPLICA IDENTITY FULL for tables pushing realtime changes
-- that might bypass standard filtering due to SECURITY DEFINER functions or RLS.
-- This ensures the 'old' object contains all row data, allowing clients to
-- confidently execute JS-side filtering.

ALTER TABLE public.listings REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
