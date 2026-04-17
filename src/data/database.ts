import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { mockDb } from './mockDatabase';

const isWeb = Platform.OS === 'web';

export interface Database {
  execSync: (sql: string) => void;
  runSync: (sql: string, params?: any[]) => { lastInsertRowId: number };
  getAllSync: <T>(sql: string, params?: any[]) => T[];
  getFirstSync: <T>(sql: string, params?: any[]) => T | null;
  withTransactionSync: (cb: () => void) => void;
}

export const getDb = (): Database => {
  try {
    if (isWeb) return mockDb as unknown as Database;
    return SQLite.openDatabaseSync('mystore.db') as unknown as Database;
  } catch (e) {
    if (isWeb) return mockDb as unknown as Database;
    throw e;
  }
};

export const initDb = () => {
  const db = getDb();
  if (isWeb) return;

  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        buy_price REAL NOT NULL,
        sell_price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        date TEXT
      );
      CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        shipping_cost REAL DEFAULT 0,
        description TEXT,
        weight_kg REAL
      );
      CREATE TABLE IF NOT EXISTS shipment_items (
        id INTEGER PRIMARY KEY NOT NULL,
        shipment_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (shipment_id) REFERENCES shipments (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY NOT NULL,
        product_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        buy_price REAL NOT NULL,
        sell_price REAL NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS manual_reports (
        id INTEGER PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL
      );
    `);
    
    // Migration for existing tables
    try { db.execSync('ALTER TABLE shipments ADD COLUMN description TEXT;'); } catch (e) {}
    try { db.execSync('ALTER TABLE shipments ADD COLUMN weight_kg REAL;'); } catch (e) {}
    try { db.execSync('ALTER TABLE sales ADD COLUMN buy_price REAL DEFAULT 0;'); } catch (e) {}
    try { db.execSync('ALTER TABLE products ADD COLUMN date TEXT;'); } catch (e) {}

  } catch (e) {
    console.error("Database initialization failed:", e);
    if (!isWeb) throw e;
  }
};
