-- ENABLE ROW LEVEL SECURITY on every Supabase table.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON shipments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON suppliers FOR ALL USING (auth.uid() = user_id);
