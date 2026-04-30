import { supabase } from '../supabase';
import { Expense } from '../../domain/models';

export class ExpenseRepository {
    async getExpenses(): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    }

    async addExpense(amount: number, date: string, description: string, userId: string) {
        const { error } = await supabase
            .from('expenses')
            .insert([{ amount, date, description, user_id: userId }]);
        if (error) throw error;
    }

    async deleteExpense(id: number) {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
    }

    async updateExpense(id: number, amount: number, date: string, description: string) {
        const { error } = await supabase
            .from('expenses')
            .update({ amount, date, description })
            .eq('id', id);
        if (error) throw error;
    }
}
