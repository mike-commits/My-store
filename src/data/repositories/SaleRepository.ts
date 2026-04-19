import { supabase } from '../supabase';
import { Sale } from '../../domain/models';

export class SaleRepository {
    async getSales(): Promise<Sale[]> {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                products (name)
            `)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map((sale: any) => ({
            ...sale,
            product_name: sale.products?.name
        }));
    }

    async getSale(id: number): Promise<Sale | null> {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async addSale(productId: number, date: string, quantity: number, buyPrice: number, sellPrice: number) {
        const { error: sError } = await supabase
            .from('sales')
            .insert([{ product_id: productId, date, quantity, buy_price: buyPrice, sell_price: sellPrice }]);
        
        if (sError) throw sError;

        // Update product quantity
        const { data: product } = await supabase.from('products').select('quantity').eq('id', productId).single();
        if (product) {
            await supabase.from('products').update({ quantity: product.quantity - quantity }).eq('id', productId);
        }
    }

    async deleteSale(id: number) {
        const sale = await this.getSale(id);
        if (sale) {
            const { data: product } = await supabase.from('products').select('quantity').eq('id', sale.product_id).single();
            if (product) {
                await supabase.from('products').update({ quantity: product.quantity + sale.quantity }).eq('id', sale.product_id);
            }
            const { error } = await supabase.from('sales').delete().eq('id', id);
            if (error) throw error;
        }
    }
}
