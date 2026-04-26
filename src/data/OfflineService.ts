import * as SQLite from 'expo-sqlite';
import { Product, Sale } from '../domain/models';

export class OfflineService {
    private dbPromise: Promise<SQLite.SQLiteDatabase>;

    constructor() {
        this.dbPromise = SQLite.openDatabaseAsync('store_offline.db');
        this.init();
    }

    private async init() {
        const db = await this.dbPromise;
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS product_cache (
                id INTEGER PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                table_name TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    async cacheProducts(products: Product[]) {
        const db = await this.dbPromise;
        await db.runAsync('DELETE FROM product_cache');
        for (const p of products) {
            await db.runAsync('INSERT INTO product_cache (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)]);
        }
    }

    async getCachedProducts(): Promise<Product[]> {
        const db = await this.dbPromise;
        const rows = await db.getAllAsync('SELECT data FROM product_cache') as any[];
        return rows.map(r => JSON.parse(r.data));
    }

    async addToSyncQueue(action: 'INSERT' | 'UPDATE' | 'DELETE', tableName: string, data: any) {
        const db = await this.dbPromise;
        await db.runAsync('INSERT INTO sync_queue (action, table_name, data) VALUES (?, ?, ?)', 
            [action, tableName, JSON.stringify(data)]);
    }

    async getSyncQueue() {
        const db = await this.dbPromise;
        return await db.getAllAsync('SELECT * FROM sync_queue ORDER BY created_at ASC');
    }

    async clearQueueItem(id: number) {
        const db = await this.dbPromise;
        await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    }
}

export const offlineService = new OfflineService();
