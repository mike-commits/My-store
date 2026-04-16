import { getDb } from '../database';
import { ManualReport } from '../../domain/models';

export class ManualReportRepository {
    getReports(): ManualReport[] {
        const db = getDb();
        return db.getAllSync<ManualReport>('SELECT * FROM manual_reports ORDER BY date DESC');
    }

    addReport(title: string, content: string, date: string) {
        const db = getDb();
        db.runSync('INSERT INTO manual_reports (date, title, content) VALUES (?, ?, ?)', [date, title, content]);
    }

    deleteReport(id: number) {
        const db = getDb();
        db.runSync('DELETE FROM manual_reports WHERE id = ?', [id]);
    }
}
