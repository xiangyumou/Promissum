/**
 * Item Service Layer
 *
 * Core business logic for time-locked encrypted items.
 * Provides direct function calls for API routes.
 */

import { prisma } from '@/lib/db/client';
import { encrypt } from '@/lib/services/encryption/tlock';
import { decrypt } from '@/lib/services/encryption/decryption';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Validation Schemas
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format item for API response
 */
function formatItemResponse(item: {
    id: string;
    type: string;
    encryptedData: string;
    originalName: string | null;
    decryptAt: bigint;
    roundNumber: bigint;
    createdAt: bigint;
    layerCount: number;
    metadata: string | null;
}): ItemResponse {
    const now = Date.now();
    const unlocked = Number(item.decryptAt) <= now;

    const response: ItemResponse = {
        id: item.id,
        type: item.type,
        originalName: item.originalName,
        decryptAt: Number(item.decryptAt),
        createdAt: Number(item.createdAt),
        layerCount: item.layerCount,
        unlocked,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
        timeRemainingMs: unlocked ? undefined : Number(item.decryptAt) - now,
        content: null,
    };

    return response;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create a new encrypted item with time lock
 */
export async function createItem(input: CreateItemInput): Promise<ItemResponse> {
    // Validate input
    const validated = createItemSchema.parse(input);

    // Calculate decrypt time
    let decryptAt: Date;
    if (validated.decryptAt) {
        decryptAt = new Date(validated.decryptAt);
        if (isNaN(decryptAt.getTime()) || decryptAt.getTime() <= Date.now()) {
            throw new Error('decryptAt must be in the future');
        }
    } else {
        decryptAt = new Date(Date.now() + validated.durationMinutes! * 60 * 1000);
    }

    // Prepare content for encryption
    let dataToEncrypt: Buffer;
    if (validated.type === 'text') {
        dataToEncrypt = Buffer.from(validated.content, 'utf-8');
    } else {
        // For images, content should be base64 encoded
        try {
            dataToEncrypt = Buffer.from(validated.content, 'base64');
        } catch {
            throw new Error('Image content must be base64 encoded');
        }
    }

    // Encrypt with tlock
    const { ciphertext, roundNumber } = await encrypt(dataToEncrypt, decryptAt);

    // Save to database
    const item = await prisma.item.create({
        data: {
            id: uuidv4(),
            type: validated.type,
            encryptedData: ciphertext,
            originalName: validated.type === 'image' ? 'image.png' : null,
            decryptAt: BigInt(decryptAt.getTime()),
            roundNumber: BigInt(roundNumber),
            createdAt: BigInt(Date.now()),
            layerCount: 1,
            metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
        },
    });

    return formatItemResponse(item);
}

/**
 * Get items with filtering and pagination
 */
export async function getItems(params?: GetItemsParams): Promise<{
    items: ItemResponse[];
    total: number;
}> {
    // Parse query parameters
    const query = querySchema.parse(params || {});
    const now = Date.now();

    // Build where clause - push ALL filters to database
    const where: Prisma.ItemWhereInput = {};

    // Type filter
    if (query.type) {
        where.type = query.type;
    }

    // Status filter - push to database WHERE clause
    if (query.status === 'locked') {
        where.decryptAt = { gt: BigInt(now) };
    } else if (query.status === 'unlocked') {
        where.decryptAt = { lte: BigInt(now) };
    }

    // Build orderBy
    const orderBy = query.sort.startsWith('created')
        ? { createdAt: query.sort === 'created_asc' ? 'asc' as const : 'desc' as const }
        : { decryptAt: query.sort === 'decrypt_asc' ? 'asc' as const : 'desc' as const };

    // Use efficient database pagination
    const [dbItems, dbTotal] = await Promise.all([
        prisma.item.findMany({
            where,
            orderBy,
            take: query.limit,
            skip: query.offset,
        }),
        prisma.item.count({ where }),
    ]);

    // Format response
    const items = dbItems.map(item => {
        const unlocked = Number(item.decryptAt) <= now;
        const metadata = item.metadata ? JSON.parse(item.metadata) : null;

        return {
            id: item.id,
            type: item.type,
            originalName: item.originalName,
            decryptAt: Number(item.decryptAt),
            createdAt: Number(item.createdAt),
            layerCount: item.layerCount,
            unlocked,
            metadata,
            timeRemainingMs: unlocked ? undefined : Number(item.decryptAt) - now,
        };
    });

    return {
        items,
        total: dbTotal,
    };
}

/**
 * Get item details by ID (attempts decryption if unlocked)
 */
export async function getItemById(id: string): Promise<ItemResponse> {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
        throw new Error('Item not found');
    }

    const now = Date.now();
    const unlocked = Number(item.decryptAt) <= now;
    const metadata = item.metadata ? JSON.parse(item.metadata) : null;

    const response: ItemResponse = {
        id: item.id,
        type: item.type,
        originalName: item.originalName,
        decryptAt: Number(item.decryptAt),
        createdAt: Number(item.createdAt),
        layerCount: item.layerCount,
        unlocked,
        metadata,
        timeRemainingMs: unlocked ? undefined : Number(item.decryptAt) - now,
        content: null,
    };

    // If unlocked, decrypt and include content
    if (unlocked) {
        try {
            const decryptedBuffer = await decrypt(item.encryptedData);

            if (item.type === 'text') {
                response.content = decryptedBuffer.toString('utf-8');
            } else {
                // Return base64 for images
                response.content = decryptedBuffer.toString('base64');
            }
        } catch (_error) {
            throw new Error('Failed to decrypt content');
        }
    }

    return response;
}

/**
 * Extend the lock duration of an item
 * Note: This re-encrypts the content with a new unlock time
 */
export async function extendItem(id: string, minutes: number): Promise<{
    success: boolean;
    decryptAt: number;
    layerCount: number;
}> {
    // Validate input
    const { minutes: validatedMinutes } = extendSchema.parse({ minutes });

    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
        throw new Error('Item not found');
    }

    const now = Date.now();
    const unlocked = Number(item.decryptAt) <= now;

    // Get content to re-encrypt
    let contentToEncrypt: Buffer;

    if (unlocked) {
        // Decrypt first
        try {
            contentToEncrypt = await decrypt(item.encryptedData);
        } catch (_error) {
            throw new Error('Failed to decrypt content for re-encryption');
        }
    } else {
        // Use existing ciphertext as-is (nested encryption)
        contentToEncrypt = Buffer.from(item.encryptedData, 'utf-8');
    }

    // Calculate new decrypt time based on original unlock time
    const newDecryptAt = new Date(Number(item.decryptAt) + validatedMinutes * 60 * 1000);

    // Re-encrypt
    const { ciphertext, roundNumber } = await encrypt(contentToEncrypt, newDecryptAt);

    // Update database with optimistic locking
    const updated = await prisma.item.updateMany({
        where: {
            id,
            layerCount: item.layerCount, // Ensure no concurrent modification
        },
        data: {
            encryptedData: ciphertext,
            decryptAt: BigInt(newDecryptAt.getTime()),
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

/**
 * Delete an item permanently
 */
export async function deleteItem(id: string): Promise<{ success: boolean }> {
    // Check if item exists
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
        throw new Error('Item not found');
    }

    // Delete item
    await prisma.item.delete({ where: { id } });

    return { success: true };
}
