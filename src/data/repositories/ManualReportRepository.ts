import { supabase } from '../supabase';
import { ManualReport } from '../../domain/models';

export class ManualReportRepository {
    async getReports(): Promise<ManualReport[]> {
        const { data, error } = await supabase
            .from('manual_reports')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    }

    async addReport(title: string, content: string, date: string) {
        const { error } = await supabase
            .from('manual_reports')
            .insert([{ date, title, content }]);
        if (error) throw error;
    }

    async deleteReport(id: number) {
        const { error } = await supabase.from('manual_reports').delete().eq('id', id);
        if (error) throw error;
    }

    async updateReport(id: number, title: string, content: string, date: string) {
        const { error } = await supabase
            .from('manual_reports')
            .update({ title, content, date })
            .eq('id', id);
        if (error) throw error;
    }
}
