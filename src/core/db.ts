/**
 * Core Database Module
 *
 * Schema, connection, and CRUD operations in one place.
 * Replaces: db/schema.ts + db/drizzle.ts + db/client.ts + API business logic
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { decrypt } from './crypto';
import type { FilterParams, Item, ItemMetadata, ContentBundle } from '@/lib/types';

// ============================================
// Schema
// ============================================

export const itemsTable = sqliteTable('items', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    encryptedData: text('encrypted_data').notNull(),
    contentSummary: text('content_summary'), // Summary/title of content
    decryptAt: integer('decrypt_at', { mode: 'timestamp' }).notNull(),
    roundNumber: integer('round_number').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    metadata: text('metadata'), // JSON string
});

// Export types
export type DbItem = typeof itemsTable.$inferSelect;
export type NewDbItem = typeof itemsTable.$inferInsert;

// ============================================
// Connection (Singleton)
// ============================================

const globalForDb = global as unknown as { db: ReturnType<typeof drizzle> | undefined };

function createDb() {
    const dbPath = process.env.DATABASE_URL || './data/promissum.db';
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');

    // Auto-create tables if they don't exist
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            encrypted_data TEXT NOT NULL,
            content_summary TEXT,
            decrypt_at INTEGER NOT NULL,
            round_number INTEGER NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
            metadata TEXT
        )
    `);

    return drizzle(sqlite, { schema: { items: itemsTable } });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db;
}

// ============================================
// Helpers
// ============================================

function isUnlocked(decryptAt: Date): boolean {
    return Date.now() >= decryptAt.getTime();
}

function formatItemResponse(item: {
    id: string;
    contentSummary: string | null;
    decryptAt: Date;
    createdAt: Date;
    metadata: string | null;
    content?: ContentBundle | null;
}): Item {
    const now = Date.now();
    const decryptAtMs = item.decryptAt.getTime();
    const unlocked = decryptAtMs <= now;

    const response: Item = {
        id: item.id,
        unlocked,
        decrypt_at: decryptAtMs,
        created_at: item.createdAt.getTime(),
        metadata: item.metadata ? JSON.parse(item.metadata) as ItemMetadata : undefined,
        content_summary: item.contentSummary ?? null,
    };

    if (!unlocked) {
        (response as unknown as Record<string, unknown>).time_remaining_ms = decryptAtMs - now;
    }

    if (item.content !== undefined) {
        response.content = item.content;
    }

    return response;
}

// ============================================
// CRUD Operations
// ============================================

export async function listItems(filters?: FilterParams): Promise<{ items: Item[]; total: number }> {
    // Build where conditions
    const conditions = [];
    if (filters?.status === 'locked') {
        conditions.push(sql`${itemsTable.decryptAt} >= ${new Date()}`);
    } else if (filters?.status === 'unlocked') {
        conditions.push(sql`${itemsTable.decryptAt} <= ${new Date()}`);
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(itemsTable);
    if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
    }
    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Build order by
    let orderByClause;
    const sort = filters?.sort || 'created_desc';
    if (sort.startsWith('created')) {
        orderByClause = sort === 'created_asc' ? asc(itemsTable.createdAt) : desc(itemsTable.createdAt);
    } else {
        orderByClause = sort === 'decrypt_asc' ? asc(itemsTable.decryptAt) : desc(itemsTable.decryptAt);
    }

    // Get paginated results
    const dbItems = await db.select({
        id: itemsTable.id,
        contentSummary: itemsTable.contentSummary,
        decryptAt: itemsTable.decryptAt,
        createdAt: itemsTable.createdAt,
        metadata: itemsTable.metadata,
    }).from(itemsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderByClause)
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0);

    const mappedItems = dbItems.map(item => formatItemResponse({
        id: item.id!,
        contentSummary: item.contentSummary ?? null,
        decryptAt: item.decryptAt!,
        createdAt: item.createdAt!,
        metadata: item.metadata ?? null,
    }));

    return { items: mappedItems, total };
}

export async function getItem(id: string): Promise<Item | null> {
    const [itemHeader] = await db.select({
        id: itemsTable.id,
        contentSummary: itemsTable.contentSummary,
        decryptAt: itemsTable.decryptAt,
        createdAt: itemsTable.createdAt,
        metadata: itemsTable.metadata,
    }).from(itemsTable).where(eq(itemsTable.id, id)).limit(1);

    if (!itemHeader) {
        return null;
    }

    const unlocked = isUnlocked(itemHeader.decryptAt!);

    const response = formatItemResponse({
        id: itemHeader.id!,
        contentSummary: itemHeader.contentSummary ?? null,
        decryptAt: itemHeader.decryptAt!,
        createdAt: itemHeader.createdAt!,
        metadata: itemHeader.metadata ?? null,
    });

    // If unlocked, fetch and decrypt content
    if (unlocked) {
        const [itemSecret] = await db.select({
            encryptedData: itemsTable.encryptedData,
        }).from(itemsTable).where(eq(itemsTable.id, id)).limit(1);

        if (itemSecret?.encryptedData) {
            try {
                const decryptedBuffer = await decrypt(itemSecret.encryptedData);

                if (decryptedBuffer) {
                    // Parse ContentBundle from decrypted data
                    const jsonString = decryptedBuffer.toString('utf-8');
                    const bundle: ContentBundle = JSON.parse(jsonString);
                    response.content = bundle;
                } else {
                    response.content = null;
                }
            } catch (error) {
                console.error('Failed to decrypt item:', id, error);
                throw new Error('Failed to decrypt content');
            }
        }
    }

    return response;
}

export async function createItem(data: {
    encryptedData: string;
    contentSummary: string | null;
    decryptAt: Date;
    roundNumber: number;
    metadata?: ItemMetadata;
}): Promise<Item> {
    const [item] = await db.insert(itemsTable).values({
        id: crypto.randomUUID(),
        encryptedData: data.encryptedData,
        contentSummary: data.contentSummary,
        decryptAt: data.decryptAt,
        roundNumber: data.roundNumber,
        metadata: JSON.stringify(data.metadata ?? {}),
    }).returning();

    return formatItemResponse({
        id: item.id!,
        contentSummary: item.contentSummary ?? null,
        decryptAt: item.decryptAt!,
        createdAt: item.createdAt!,
        metadata: item.metadata ?? null,
    });
}

export async function deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(itemsTable).where(eq(itemsTable.id, id));
    return result.changes > 0;
}

export async function getStats(): Promise<{
    totalItems: number;
    lockedItems: number;
    unlockedItems: number;
}> {
    const allItems = await db.select({
        decryptAt: itemsTable.decryptAt,
    }).from(itemsTable);

    const now = Date.now();
    let unlockedCount = 0;

    for (const item of allItems) {
        if (item.decryptAt && item.decryptAt.getTime() <= now) {
            unlockedCount++;
        }
    }

    return {
        totalItems: allItems.length,
        lockedItems: allItems.length - unlockedCount,
        unlockedItems: unlockedCount,
    };
}
