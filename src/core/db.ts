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
import type { FilterParams, Item, ItemMetadata } from '@/lib/types';

// ============================================
// Schema
// ============================================

export const itemsTable = sqliteTable('items', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: text('type').notNull(), // 'text' | 'image'
    encryptedData: text('encrypted_data').notNull(),
    originalName: text('original_name'),
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
    const dbPath = process.env.DATABASE_URL || './promissum.db';
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
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
    type: string;
    originalName: string | null;
    decryptAt: Date;
    createdAt: Date;
    metadata: string | null;
    content?: string | null;
}): Item {
    const now = Date.now();
    const decryptAtMs = item.decryptAt.getTime();
    const unlocked = decryptAtMs <= now;

    const response: Item = {
        id: item.id,
        type: item.type as 'text' | 'image',
        unlocked,
        decrypt_at: decryptAtMs,
        created_at: item.createdAt.getTime(),
        metadata: item.metadata ? JSON.parse(item.metadata) as ItemMetadata : undefined,
        original_name: item.originalName ?? null,
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
    if (filters?.type) {
        conditions.push(eq(itemsTable.type, filters.type));
    }
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
        type: itemsTable.type,
        originalName: itemsTable.originalName,
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
        type: item.type!,
        originalName: item.originalName ?? null,
        decryptAt: item.decryptAt!,
        createdAt: item.createdAt!,
        metadata: item.metadata ?? null,
    }));

    return { items: mappedItems, total };
}

export async function getItem(id: string): Promise<Item | null> {
    const [itemHeader] = await db.select({
        id: itemsTable.id,
        type: itemsTable.type,
        originalName: itemsTable.originalName,
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
        type: itemHeader.type!,
        originalName: itemHeader.originalName ?? null,
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
                    if (itemHeader.type === 'text') {
                        response.content = decryptedBuffer.toString('utf-8');
                    } else {
                        const base64Content = decryptedBuffer.toString('base64');
                        response.content = `data:image/png;base64,${base64Content}`;
                    }
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
    type: 'text' | 'image';
    encryptedData: string;
    originalName: string | null;
    decryptAt: Date;
    roundNumber: number;
    metadata?: ItemMetadata;
}): Promise<Item> {
    const [item] = await db.insert(itemsTable).values({
        id: crypto.randomUUID(),
        type: data.type,
        encryptedData: data.encryptedData,
        originalName: data.originalName,
        decryptAt: data.decryptAt,
        roundNumber: data.roundNumber,
        metadata: JSON.stringify(data.metadata ?? {}),
    }).returning();

    return formatItemResponse({
        id: item.id!,
        type: item.type!,
        originalName: item.originalName ?? null,
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
    byType: { text: number; image: number };
}> {
    const allItems = await db.select({
        type: itemsTable.type,
        decryptAt: itemsTable.decryptAt,
    }).from(itemsTable);

    const now = Date.now();
    let textCount = 0;
    let imageCount = 0;
    let unlockedCount = 0;

    for (const item of allItems) {
        if (item.type === 'text') textCount++;
        else if (item.type === 'image') imageCount++;

        if (item.decryptAt && item.decryptAt.getTime() <= now) {
            unlockedCount++;
        }
    }

    return {
        totalItems: allItems.length,
        lockedItems: allItems.length - unlockedCount,
        unlockedItems: unlockedCount,
        byType: { text: textCount, image: imageCount },
    };
}
