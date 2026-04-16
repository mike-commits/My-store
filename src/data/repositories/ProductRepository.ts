import { getDb } from '../database';
import { Product, ShipmentItem, Sale } from '../../domain/models';

export class ProductRepository {
    getProducts(): Product[] {
        const db = getDb();
        return db.getAllSync<Product>(`
            SELECT p.*, 
            COALESCE((SELECT SUM(quantity) FROM shipment_items WHERE product_id = p.id), 0) as shipped_quantity,
            COALESCE((SELECT SUM(quantity) FROM sales WHERE product_id = p.id), 0) as sold_quantity
            FROM products p
        `);
    }

    getProduct(id: number): Product | null {
        const db = getDb();
        return db.getFirstSync<Product>('SELECT * FROM products WHERE id = ?', [id]);
    }

    addProduct(product: Omit<Product, 'id'>) {
        const db = getDb();
        const result = db.runSync(
            'INSERT INTO products (name, category, buy_price, sell_price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [product.name, product.category, product.buy_price, product.sell_price, product.quantity, product.notes]
        );
        return result.lastInsertRowId;
    }

    updateProduct(product: Product) {
        const db = getDb();
        db.runSync(
            'UPDATE products SET name = ?, category = ?, buy_price = ?, sell_price = ?, quantity = ?, notes = ? WHERE id = ?',
            [product.name, product.category, product.buy_price, product.sell_price, product.quantity, product.notes, product.id]
        );
    }

    deleteProduct(id: number) {
        const db = getDb();
        db.runSync('DELETE FROM products WHERE id = ?', [id]);
    }

    getProductShipments(productId: number): (ShipmentItem & { date: string })[] {
        const db = getDb();
        return db.getAllSync<ShipmentItem & { date: string }>(`
            SELECT si.*, s.date 
            FROM shipment_items si
            JOIN shipments s ON si.shipment_id = s.id
            WHERE si.product_id = ?
            ORDER BY s.date DESC
        `, [productId]);
    }

    getProductSales(productId: number): Sale[] {
        const db = getDb();
        return db.getAllSync<Sale>(`
            SELECT * FROM sales 
            WHERE product_id = ? 
            ORDER BY date DESC
        `, [productId]);
    }
}
