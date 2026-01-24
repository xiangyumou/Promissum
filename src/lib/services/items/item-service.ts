/**
 * Item Service Layer
 *
 * Core business logic for time-locked encrypted items.
 * Provides direct function calls for API routes.
 */

import { prisma } from '@/lib/db/client';
import { encrypt } from '@/lib/services/encryption/tlock';
import { decrypt } from '@/lib/services/encryption/decryption';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export interface ItemResponse {
    id: string;
    type: string;
    originalName: string | null;
    decryptAt: number;
    createdAt: number;
    layerCount: number;
    unlocked: boolean;
    metadata: Record<string, unknown> | null;
    content?: string | null;
    timeRemainingMs?: number;
}

export interface CreateItemInput {
    type: 'text' | 'image';
    content: string;
    durationMinutes?: number;
    decryptAt?: number;
    metadata?: Record<string, unknown>;
}

export interface GetItemsParams {
    status?: 'locked' | 'unlocked' | 'all';
    type?: 'text' | 'image';
    limit?: number;
    offset?: number;
    sort?: 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc';
}

export const createItemSchema = z.object({
    type: z.enum(['text', 'image']),
    content: z.string().min(1, "Content cannot be empty"),
    durationMinutes: z.number().int().positive("Duration must be positive").optional(),
    decryptAt: z.number().int().positive("Decrypt time must be positive").optional(),
    metadata: z.record(z.string(), z.any()).optional(),
}).superRefine((data, ctx) => {
    if (data.durationMinutes === undefined && data.decryptAt === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either durationMinutes or decryptAt must be provided',
            path: ['durationMinutes']
        });
    }
});

export const querySchema = z.object({
    status: z.enum(['locked', 'unlocked', 'all']).optional().default('all'),
    type: z.enum(['text', 'image']).optional(),
    limit: z.number().int().positive().max(1000).optional().default(50),
    offset: z.number().int().nonnegative().optional().default(0),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional().default('created_desc'),
});

export const extendSchema = z.object({
    minutes: z.number().int().positive("Minutes must be positive"),
});

function formatItemResponse(item: {
    id: string;
    type: string;
    originalName: string | null;
    decryptAt: Date;
    createdAt: Date;
    layerCount: number;
    metadata: Prisma.JsonValue | null;
    encryptedData?: string;
}): ItemResponse {
    const now = Date.now();
    const decryptAtMs = item.decryptAt.getTime();
    const unlocked = decryptAtMs <= now;

    const metadata = (item.metadata as Record<string, unknown>) || null;

    const response: ItemResponse = {
        id: item.id,
        type: item.type,
        originalName: item.originalName,
        decryptAt: decryptAtMs,
        createdAt: item.createdAt.getTime(),
        layerCount: item.layerCount,
        unlocked,
        metadata,
        timeRemainingMs: unlocked ? undefined : decryptAtMs - now,
        content: null,
    };

    return response;
}

export async function createItem(input: CreateItemInput): Promise<ItemResponse> {
    const validated = createItemSchema.parse(input);

    let decryptAt: Date;
    if (validated.decryptAt) {
        decryptAt = new Date(validated.decryptAt);
        if (isNaN(decryptAt.getTime()) || decryptAt.getTime() <= Date.now()) {
            throw new Error('decryptAt must be in the future');
        }
    } else {
        decryptAt = new Date(Date.now() + validated.durationMinutes! * 60 * 1000);
    }

    let dataToEncrypt: Buffer;
    if (validated.type === 'text') {
        dataToEncrypt = Buffer.from(validated.content, 'utf-8');
    } else {
        try {
            dataToEncrypt = Buffer.from(validated.content, 'base64');
        } catch {
            throw new Error('Image content must be base64 encoded');
        }
    }

    const { ciphertext, roundNumber } = await encrypt(dataToEncrypt, decryptAt);

    const item = await prisma.item.create({
        data: {
            id: crypto.randomUUID(),
            type: validated.type,
            encryptedData: ciphertext,
            originalName: validated.type === 'image' ? 'image.png' : null,
            decryptAt: decryptAt,
            roundNumber: BigInt(roundNumber),
            createdAt: new Date(),
            layerCount: 1,
            metadata: validated.metadata ?? Prisma.JsonNull,
        },
    });

    return formatItemResponse(item);
}

export async function getItems(params?: GetItemsParams): Promise<{
    items: ItemResponse[];
    total: number;
}> {
    const query = querySchema.parse(params || {});
    const now = new Date();

    const where: Prisma.ItemWhereInput = {};

    if (query.type) {
        where.type = query.type;
    }

    if (query.status === 'locked') {
        where.decryptAt = { gt: now };
    } else if (query.status === 'unlocked') {
        where.decryptAt = { lte: now };
    }

    const orderBy = query.sort.startsWith('created')
        ? { createdAt: query.sort === 'created_asc' ? 'asc' as const : 'desc' as const }
        : { decryptAt: query.sort === 'decrypt_asc' ? 'asc' as const : 'desc' as const };

    const [dbItems, dbTotal] = await Promise.all([
        prisma.item.findMany({
            where,
            orderBy,
            take: query.limit,
            skip: query.offset,
            select: {
                id: true,
                type: true,
                originalName: true,
                decryptAt: true,
                createdAt: true,
                layerCount: true,
                metadata: true,
            }
        }),
        prisma.item.count({ where }),
    ]);

    const items = dbItems.map(item => {
        const decryptAtMs = item.decryptAt.getTime();
        const unlocked = decryptAtMs <= now.getTime();
        const metadata = (item.metadata as Record<string, unknown>) || null;

        return {
            id: item.id,
            type: item.type,
            originalName: item.originalName,
            decryptAt: decryptAtMs,
            createdAt: item.createdAt.getTime(),
            layerCount: item.layerCount,
            unlocked,
            metadata,
            timeRemainingMs: unlocked ? undefined : decryptAtMs - now.getTime(),
        };
    });

    return {
        items,
        total: dbTotal,
    };
}

export async function getItemById(id: string): Promise<ItemResponse> {
    const itemHeader = await prisma.item.findUnique({
        where: { id },
        select: {
            id: true,
            type: true,
            originalName: true,
            decryptAt: true,
            createdAt: true,
            layerCount: true,
            metadata: true,
        }
    });

    if (!itemHeader) {
        throw new Error('Item not found');
    }

    const now = Date.now();
    const unlocked = itemHeader.decryptAt.getTime() <= now;

    const response = formatItemResponse(itemHeader);

    if (unlocked) {
        const itemSecret = await prisma.item.findUnique({
            where: { id },
            select: { encryptedData: true }
        });

        if (itemSecret?.encryptedData) {
            try {
                const decryptedBuffer = await decrypt(itemSecret.encryptedData);

                if (itemHeader.type === 'text') {
                    response.content = decryptedBuffer.toString('utf-8');
                } else {
                    response.content = decryptedBuffer.toString('base64');
                }
            } catch (_error) {
                console.error("Failed to decrypt item:", id, _error);
                throw new Error('Failed to decrypt content');
            }
        }
    }

    return response;
}

export async function extendItem(id: string, minutes: number): Promise<{
    success: boolean;
    decryptAt: number;
    layerCount: number;
}> {
    const { minutes: validatedMinutes } = extendSchema.parse({ minutes });

    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
        throw new Error('Item not found');
    }

    const now = Date.now();
    const unlocked = item.decryptAt.getTime() <= now;

    let contentToEncrypt: Buffer;

    if (unlocked) {
        try {
            contentToEncrypt = await decrypt(item.encryptedData);
        } catch (_error) {
            throw new Error('Failed to decrypt content for re-encryption');
        }
    } else {
        contentToEncrypt = Buffer.from(item.encryptedData, 'utf-8');
    }

    const baseTimeMs = unlocked ? now : item.decryptAt.getTime();
    const newDecryptAt = new Date(baseTimeMs + validatedMinutes * 60 * 1000);

    const { ciphertext, roundNumber } = await encrypt(contentToEncrypt, newDecryptAt);

    const updated = await prisma.item.updateMany({
        where: {
            id,
            layerCount: item.layerCount,
        },
        data: {
            encryptedData: ciphertext,
            decryptAt: newDecryptAt,
            roundNumber: BigInt(roundNumber),
            layerCount: item.layerCount + 1,
        },
    });

    if (updated.count === 0) {
        throw new Error('Item was modified during operation, please retry');
    }

    return {
        success: true,
        decryptAt: newDecryptAt.getTime(),
        layerCount: item.layerCount + 1,
    };
}

export async function deleteItem(id: string): Promise<{ success: boolean }> {
    try {
        await prisma.item.delete({ where: { id } });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new Error('Item not found');
        }
        throw error;
    }

    return { success: true };
}
