-- SUPABASE RLS POLICIES FOR RETAIL MANAGER

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for Products
CREATE POLICY "Users can manage their own products" ON products
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for Shipments
CREATE POLICY "Users can manage their own shipments" ON shipments
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for Shipment Items
CREATE POLICY "Users can manage their own shipment items" ON shipment_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shipments 
            WHERE shipments.id = shipment_items.shipment_id 
            AND shipments.user_id = auth.uid()
        )
    );

-- Create policies for Sales
CREATE POLICY "Users can manage their own sales" ON sales
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for Payments
CREATE POLICY "Users can manage their own payments" ON payments
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for Expenses
CREATE POLICY "Users can manage their own expenses" ON expenses
    FOR ALL USING (auth.uid() = user_id);

-- Create policies for Manual Reports
CREATE POLICY "Users can manage their own reports" ON manual_reports
    FOR ALL USING (auth.uid() = user_id);

-- Storage bucket policies for "product-images"
-- Note: These must be created in the Storage section of Supabase dashboard
-- 1. Insert: auth.uid() IS NOT NULL
-- 2. Select: true (public read)
-- 3. Delete: auth.uid() = owner
