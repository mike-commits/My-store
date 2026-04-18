import { getDb } from '../database';
import { Shipment, ShipmentItem } from '../../domain/models';

export class ShipmentRepository {
    getShipments(): Shipment[] {
        const db = getDb();
        return db.getAllSync<Shipment>('SELECT * FROM shipments ORDER BY date DESC');
    }

    getShipmentItems(shipmentId: number): ShipmentItem[] {
        const db = getDb();
        return db.getAllSync<ShipmentItem>(`
            SELECT si.*, p.name as product_name
            FROM shipment_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.shipment_id = ?
        `, [shipmentId]);
    }

    addShipment(date: string, status: string, items: Omit<ShipmentItem, 'id' | 'shipment_id'>[], shippingCost: number = 0, description?: string, weightKg?: number) {
        const db = getDb();
        db.withTransactionSync(() => {
            const result = db.runSync(
                'INSERT INTO shipments (date, status, shipping_cost, description, weight_kg) VALUES (?, ?, ?, ?, ?)', 
                [date, status, shippingCost, description || null, weightKg || null]
            );
            const shipmentId = result.lastInsertRowId;

            for (const item of items) {
                db.runSync('INSERT INTO shipment_items (shipment_id, product_id, quantity) VALUES (?, ?, ?)', 
                    [shipmentId, item.product_id, item.quantity]);
                
                db.runSync('UPDATE products SET quantity = quantity + ? WHERE id = ?', 
                    [item.quantity, item.product_id]);
            }
        });
    }

    deleteShipment(id: number) {
        const db = getDb();
        db.withTransactionSync(() => {
            const items = this.getShipmentItems(id);
            for (const item of items) {
                db.runSync('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
            }
            db.runSync('DELETE FROM shipment_items WHERE shipment_id = ?', [id]);
            db.runSync('DELETE FROM shipments WHERE id = ?', [id]);
        });
    }
}
