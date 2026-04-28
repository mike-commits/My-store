-- ============================================================
-- Migration: 001_rls_policies.sql
-- Purpose:   Create user_profiles table and enable Row Level
--            Security (RLS) on products, sales, shipments, and
--            user_profiles so each user can only access their
--            own data.  Run this once against your Supabase project.
-- ============================================================

-- ── user_profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  store_name  TEXT,
  role        TEXT NOT NULL DEFAULT 'owner'
              CHECK (role IN ('owner', 'manager', 'staff')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── products ──────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "products_select_own"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "products_insert_own"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "products_update_own"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "products_delete_own"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- ── sales ────────────────────────────────────────────────
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "sales_select_own"
  ON sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "sales_insert_own"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "sales_update_own"
  ON sales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "sales_delete_own"
  ON sales FOR DELETE
  USING (auth.uid() = user_id);

-- ── shipments ────────────────────────────────────────────
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "shipments_select_own"
  ON shipments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "shipments_insert_own"
  ON shipments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "shipments_update_own"
  ON shipments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "shipments_delete_own"
  ON shipments FOR DELETE
  USING (auth.uid() = user_id);
