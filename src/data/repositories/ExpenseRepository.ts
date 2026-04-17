import { getDb } from '../database';
import { Expense } from '../../domain/models';

export class ExpenseRepository {
    getExpenses(): Expense[] {
        const db = getDb();
        return db.getAllSync<Expense>('SELECT * FROM expenses ORDER BY date DESC');
    }

    addExpense(amount: number, date: string, description: string) {
        const db = getDb();
        db.runSync('INSERT INTO expenses (amount, date, description) VALUES (?, ?, ?)', [amount, date, description]);
    }

    deleteExpense(id: number) {
        const db = getDb();
        db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
    }

    updateExpense(id: number, amount: number, date: string, description: string) {
        const db = getDb();
        db.runSync('UPDATE expenses SET amount = ?, date = ?, description = ? WHERE id = ?', [amount, date, description, id]);
    }
}
