import { getDb } from '../database';
import { Payment } from '../../domain/models';

export class PaymentRepository {
    getPayments(): Payment[] {
        const db = getDb();
        return db.getAllSync<Payment>('SELECT * FROM payments ORDER BY date DESC');
    }

    addPayment(amount: number, date: string, notes: string) {
        const db = getDb();
        db.runSync('INSERT INTO payments (amount, date, notes) VALUES (?, ?, ?)', [amount, date, notes]);
    }

    deletePayment(id: number) {
        const db = getDb();
        db.runSync('DELETE FROM payments WHERE id = ?', [id]);
    }
}
