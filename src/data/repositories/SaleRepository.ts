import { getDb } from '../database';
import { Sale } from '../../domain/models';

export class SaleRepository {
    getSales(): Sale[] {
        const db = getDb();
        return db.getAllSync<Sale>(`
            SELECT s.*, p.name as product_name 
            FROM sales s 
            JOIN products p ON s.product_id = p.id 
            ORDER BY s.date DESC
        `);
    }

    getSale(id: number): Sale | null {
        const db = getDb();
        return db.getFirstSync<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
    }

    addSale(productId: number, date: string, quantity: number, buyPrice: number, sellPrice: number) {
        const db = getDb();
        db.withTransactionSync(() => {
            db.runSync(
                'INSERT INTO sales (product_id, date, quantity, buy_price, sell_price) VALUES (?, ?, ?, ?, ?)',
                [productId, date, quantity, buyPrice, sellPrice]
            );
            db.runSync('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantity, productId]);
        });
    }

    deleteSale(id: number) {
        const db = getDb();
        db.withTransactionSync(() => {
            const sale = this.getSale(id);
            if (sale) {
                db.runSync('UPDATE products SET quantity = quantity + ? WHERE id = ?', [sale.quantity, sale.product_id]);
                db.runSync('DELETE FROM sales WHERE id = ?', [id]);
            }
        });
    }
}
