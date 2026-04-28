import { supabase } from '../supabase';
import { Customer } from '../../domain/models';

export class CustomerRepository {
    async getCustomers(): Promise<Customer[]> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data || [];
    }

    async addCustomer(customer: Omit<Customer, 'id' | 'total_spent' | 'last_purchase'> & { user_id: string }) {
        const { error } = await supabase
            .from('customers')
            .insert([customer]);
        
        if (error) throw error;
    }

    async updateCustomer(id: number, customer: Partial<Customer>) {
        const { error } = await supabase
            .from('customers')
            .update(customer)
            .eq('id', id);
        
        if (error) throw error;
    }

    async deleteCustomer(id: number) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    }
}
