import { supabase } from '../supabase';
import { Product, ShipmentItem, Sale } from '../../domain/models';

export class ProductRepository {
    async getProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                shipment_items (quantity),
                sales (quantity)
            `);
        
        if (error) throw error;
        
        return (data || []).map((p: any) => ({
            ...p,
            shipped_quantity: p.shipment_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
            sold_quantity: p.sales?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        }));
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
        const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select()
            .single();
        
        if (error) throw error;
        return data.id;
    }

    async updateProduct(product: Product) {
        const { error } = await supabase
            .from('products')
            .update(product)
            .eq('id', product.id);
        
        if (error) throw error;
    }

    async deleteProduct(id: number) {
        // RLS or cascading deletes should handle this, but for parity:
        await supabase.from('sales').delete().eq('product_id', id);
        await supabase.from('shipment_items').delete().eq('product_id', id);
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
