import { db } from '@/lib/db/client';
import { items, type NewItem } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, like, or } from 'drizzle-orm';

export interface CreateItemData {
    id: string;
    type: string;
    encryptedData: string;
    originalName: string | null;
    decryptAt: Date;
    roundNumber: bigint;
    layerCount: number;
    metadata: Record<string, unknown>;
}

export async function createItemInDb(data: CreateItemData) {
    const newItem: NewItem = {
        id: data.id,
        type: data.type,
        encryptedData: data.encryptedData,
        originalName: data.originalName,
        decryptAt: data.decryptAt,
        roundNumber: Number(data.roundNumber),
        layerCount: data.layerCount,
        metadata: JSON.stringify(data.metadata),
    };

    await db.insert(items).values(newItem);
    return newItem;
}

export interface FindItemsParams {
    where: {
        type?: string;
        decryptAt?: { gte?: Date; lte?: Date };
        OR?: Array<{ type?: string; decryptAt?: { gte?: Date } }>;
    };
    orderBy: { decryptAt?: 'asc' | 'desc'; createdAt?: 'asc' | 'desc' };
    take: number;
    skip: number;
}

export async function findItemsInDb(params: FindItemsParams) {
    // Build where conditions
    const conditions = [];
    if (params.where.type) {
        conditions.push(eq(items.type, params.where.type));
    }
    if (params.where.decryptAt?.gte) {
        conditions.push(sql`${items.decryptAt} >= ${params.where.decryptAt.gte}`);
    }
    if (params.where.decryptAt?.lte) {
        conditions.push(sql`${items.decryptAt} <= ${params.where.decryptAt.lte}`);
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(items);
    if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
    }
    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Build main query
    let query = db.select({
        id: items.id,
        type: items.type,
        originalName: items.originalName,
        decryptAt: items.decryptAt,
        createdAt: items.createdAt,
        layerCount: items.layerCount,
        metadata: items.metadata,
    }).from(items);

    if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
    }

    // Build order by
    let orderByClause;
    if (params.orderBy.decryptAt) {
        orderByClause = params.orderBy.decryptAt === 'asc' ? asc(items.decryptAt) : desc(items.decryptAt);
    } else if (params.orderBy.createdAt) {
        orderByClause = params.orderBy.createdAt === 'asc' ? asc(items.createdAt) : desc(items.createdAt);
    }

    // Get paginated results
    const results = await query
        .orderBy(orderByClause || desc(items.createdAt))
        .limit(params.take)
        .offset(params.skip);

    return [results, total] as const;
}

export async function findItemHeaderById(id: string) {
    const result = await db.select({
        id: items.id,
        type: items.type,
        originalName: items.originalName,
        decryptAt: items.decryptAt,
        createdAt: items.createdAt,
        layerCount: items.layerCount,
        metadata: items.metadata,
    }).from(items).where(eq(items.id, id)).limit(1);

    return result[0] || null;
}

export async function findItemEncryptedData(id: string) {
    const result = await db.select({
        encryptedData: items.encryptedData,
    }).from(items).where(eq(items.id, id)).limit(1);

    return result[0] || null;
}

export async function findItemForExtension(id: string) {
    const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return result[0] || null;
}

export interface UpdateItemExtensionParams {
    id: string;
    currentLayerCount: number;
    encryptedData: string;
    decryptAt: Date;
    roundNumber: bigint;
}

export async function updateItemExtension(params: UpdateItemExtensionParams) {
    const result = await db.update(items)
        .set({
            encryptedData: params.encryptedData,
            decryptAt: params.decryptAt,
            roundNumber: Number(params.roundNumber),
            layerCount: params.currentLayerCount + 1,
        })
        .where(and(
            eq(items.id, params.id),
            eq(items.layerCount, params.currentLayerCount)
        ));

    if (result.changes === 0) {
        throw new Error('Item was modified during operation, please retry');
    }

    return result;
}

export async function deleteItemFromDb(id: string) {
    const result = await db.delete(items).where(eq(items.id, id));

    if (result.changes === 0) {
        throw new Error('Item not found');
    }

    return true;
}
