import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../domain/models';

const PRODUCT_CACHE_KEY = '@product_cache';
const SYNC_QUEUE_KEY = '@sync_queue';

export class OfflineService {
    async cacheProducts(products: Product[]) {
        try {
            await AsyncStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(products));
        } catch (e) {
            console.error('Failed to cache products', e);
        }
    }

    async getCachedProducts(): Promise<Product[]> {
        try {
            const data = await AsyncStorage.getItem(PRODUCT_CACHE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    async addToSyncQueue(action: 'INSERT' | 'UPDATE' | 'DELETE', tableName: string, data: any) {
        try {
            const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            const queue = queueStr ? JSON.parse(queueStr) : [];
            queue.push({ id: Date.now(), action, table_name: tableName, data, created_at: new Date().toISOString() });
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to add to sync queue', e);
        }
    }

    async getSyncQueue() {
        try {
            const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            return queueStr ? JSON.parse(queueStr) : [];
        } catch {
            return [];
        }
    }

    async clearQueueItem(id: number) {
        try {
            const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
            let queue = queueStr ? JSON.parse(queueStr) : [];
            queue = queue.filter((item: any) => item.id !== id);
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to clear queue item', e);
        }
    }
}

export const offlineService = new OfflineService();
