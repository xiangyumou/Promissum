import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const globalForDb = global as unknown as { db: ReturnType<typeof drizzle> | undefined };

function createDb() {
    const dbPath = process.env.DATABASE_URL || './promissum.db';
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency
    return drizzle(sqlite, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db;
}
