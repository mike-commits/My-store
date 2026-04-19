import { supabase } from '../supabase';
import { Payment } from '../../domain/models';

export class PaymentRepository {
    async getPayments(): Promise<Payment[]> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    }

    async addPayment(amount: number, date: string, notes: string) {
        const { error } = await supabase
            .from('payments')
            .insert([{ amount, date, notes }]);
        if (error) throw error;
    }

    async deletePayment(id: number) {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) throw error;
    }

    async updatePayment(id: number, amount: number, date: string, notes: string) {
        const { error } = await supabase
            .from('payments')
            .update({ amount, date, notes })
            .eq('id', id);
        if (error) throw error;
    }
}
