import { supabase } from '../supabase';
import { Product, ShipmentItem, Sale } from '../../domain/models';

export class ProductRepository {
    async getProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data || [];
    }

    async getProduct(id: number): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async addProduct(product: Omit<Product, 'id'>) {
        const { name, category, buy_price, sell_price, quantity, date, notes, user_id } = product as any;
        const { data, error } = await supabase
            .from('products')
            .insert([{ name, category, buy_price, sell_price, quantity, date, notes, user_id }])
            .select()
            .single();
        
        if (error || !data) throw error || new Error('Failed to create product');
        return data.id;
    }

    async updateProduct(product: Product) {
        const { id, name, category, buy_price, sell_price, quantity, date, notes, image_url, user_id } = product as any;
        
        // Build update object only with defined values to avoid RLS issues with user_id
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (category !== undefined) updateData.category = category;
        if (buy_price !== undefined) updateData.buy_price = buy_price;
        if (sell_price !== undefined) updateData.sell_price = sell_price;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (date !== undefined) updateData.date = date;
        if (notes !== undefined) updateData.notes = notes;
        if (image_url !== undefined) updateData.image_url = image_url;
        if (user_id !== undefined) updateData.user_id = user_id;

        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id);
        
        if (error) throw error;
    }

    async deleteProduct(id: number) {
        // Dependent items (sales, shipment_items) are handled by ON DELETE CASCADE in the DB
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
    }

    async getProductShipments(productId: number): Promise<(ShipmentItem & { date: string })[]> {
        const { data, error } = await supabase
            .from('shipment_items')
            .select(`
                *,
                shipments (date)
            `)
            .eq('product_id', productId)
            .order('shipments(date)', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map((item: any) => ({
            ...item,
            date: item.shipments?.date
        }));
    }

    async getProductSales(productId: number): Promise<Sale[]> {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('product_id', productId)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    }
}
