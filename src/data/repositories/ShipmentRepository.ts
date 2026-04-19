import { supabase } from '../supabase';
import { Shipment, ShipmentItem } from '../../domain/models';

export class ShipmentRepository {
    async getShipments(): Promise<Shipment[]> {
        const { data, error } = await supabase
            .from('shipments')
            .select(`
                *,
                shipment_items (
                    *,
                    products (name)
                )
            `)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map((s: any) => ({
            ...s,
            items: s.shipment_items?.map((item: any) => ({
                ...item,
                product_name: item.products?.name
            }))
        }));
    }

    async getShipmentItems(shipmentId: number): Promise<ShipmentItem[]> {
        const { data, error } = await supabase
            .from('shipment_items')
            .select(`
                *,
                products (name)
            `)
            .eq('shipment_id', shipmentId);
        
        if (error) throw error;
        
        return (data || []).map((item: any) => ({
            ...item,
            product_name: item.products?.name
        }));
    }

    async addShipment(date: string, status: string, items: Omit<ShipmentItem, 'id' | 'shipment_id'>[], shippingCost: number = 0, description?: string, weightKg?: number) {
        // In a real production app, this should be a stored procedure (RPC) for atomicity
        const { data: shipment, error: sError } = await supabase
            .from('shipments')
            .insert([{ date, status, shipping_cost: shippingCost, description: description || null, weight_kg: weightKg || null }])
            .select()
            .single();
        
        if (sError) throw sError;

        const shipmentItems = items.map(item => ({
            shipment_id: shipment.id,
            product_id: item.product_id,
            quantity: item.quantity
        }));

        const { error: iError } = await supabase.from('shipment_items').insert(shipmentItems);
        if (iError) throw iError;

        // Update product quantities
        for (const item of items) {
            const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
            if (product) {
                await supabase.from('products').update({ quantity: product.quantity + item.quantity }).eq('id', item.product_id);
            }
        }
    }

    async deleteShipment(id: number) {
        const items = await this.getShipmentItems(id);
        
        for (const item of items) {
            const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
            if (product) {
                await supabase.from('products').update({ quantity: product.quantity - item.quantity }).eq('id', item.product_id);
            }
        }

        await supabase.from('shipment_items').delete().eq('shipment_id', id);
        const { error } = await supabase.from('shipments').delete().eq('id', id);
        if (error) throw error;
    }
}
