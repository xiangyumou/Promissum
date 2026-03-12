/**
 * Item Service Layer
 *
 * Core business logic for time-locked encrypted items.
 * Orchestrates Validation, Encryption, and Repository layers.
 */

import { encrypt } from '@/lib/services/encryption/tlock';
import { decrypt } from '@/lib/services/encryption/decryption';
import {
    CreateItemInput,
    QueryInput as GetItemsInput,
    ItemResponse,
    CreateItemSchema,
    ExtendItemSchema,
    QuerySchema
} from '@/lib/validation';
import * as itemRepo from './item-repository';

// Re-export types for consumers
export type { CreateItemInput, GetItemsInput, ItemResponse };

export function formatItemResponse(item: {
    id: string;
    type: string;
    originalName: string | null;
    decryptAt: Date;
    createdAt: Date;
    layerCount: number;
    metadata: string | null;
    encryptedData?: string;
}): ItemResponse {
    const now = Date.now();
    const decryptAtMs = item.decryptAt.getTime();
    const unlocked = decryptAtMs <= now;

    const metadata = item.metadata ? JSON.parse(item.metadata) as Record<string, unknown> : null;

    return {
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
}

export async function createItem(input: CreateItemInput): Promise<ItemResponse> {
    const validated = CreateItemSchema.parse(input);

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

    const item = await itemRepo.createItemInDb({
        id: crypto.randomUUID(),
        type: validated.type,
        encryptedData: ciphertext,
        originalName: validated.type === 'image' ? 'image.png' : null,
        decryptAt: decryptAt,
        roundNumber: BigInt(roundNumber),
        layerCount: 1,
        metadata: validated.metadata ?? {},
    });

    return formatItemResponse({
        id: item.id!,
        type: item.type!,
        originalName: item.originalName ?? null,
        decryptAt: item.decryptAt!,
        createdAt: item.createdAt!,
        layerCount: item.layerCount!,
        metadata: item.metadata ?? null,
        encryptedData: item.encryptedData,
    });
}

export async function getItems(params?: GetItemsInput): Promise<{
    items: ItemResponse[];
    total: number;
}> {
    const query = QuerySchema.parse(params || {});
    const now = new Date();

    const where: itemRepo.FindItemsParams['where'] = {};

    if (query.type) {
        where.type = query.type;
    }

    if (query.status === 'locked') {
        where.decryptAt = { gte: now };
    } else if (query.status === 'unlocked') {
        where.decryptAt = { lte: now };
    }

    const orderBy = query.sort.startsWith('created')
        ? { createdAt: query.sort === 'created_asc' ? 'asc' as const : 'desc' as const }
        : { decryptAt: query.sort === 'decrypt_asc' ? 'asc' as const : 'desc' as const };

    const [dbItems, dbTotal] = await itemRepo.findItemsInDb({
        where,
        orderBy,
        take: query.limit,
        skip: query.offset,
    });

    const items = dbItems.map(item => formatItemResponse({
        ...item,
        createdAt: item.createdAt!,
        metadata: item.metadata ?? null,
    }));

    return {
        items,
        total: dbTotal,
    };
}

export async function getItemById(id: string): Promise<ItemResponse> {
    const itemHeader = await itemRepo.findItemHeaderById(id);

    if (!itemHeader) {
        throw new Error('Item not found');
    }

    const now = Date.now();
    const unlocked = itemHeader.decryptAt.getTime() <= now;

    const response = formatItemResponse({
        ...itemHeader,
        createdAt: itemHeader.createdAt!,
        metadata: itemHeader.metadata ?? null,
    });

    if (unlocked) {
        const itemSecret = await itemRepo.findItemEncryptedData(id);

        if (itemSecret?.encryptedData) {
            try {
                const decryptedBuffer = await decrypt(itemSecret.encryptedData);

                if (itemHeader.type === 'text') {
                    response.content = decryptedBuffer.toString('utf-8');
                } else {
                    const base64Content = decryptedBuffer.toString('base64');
                    response.content = `data:image/png;base64,${base64Content}`;
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
    const { minutes: validatedMinutes } = ExtendItemSchema.parse({ minutes });

    const item = await itemRepo.findItemForExtension(id);

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

    await itemRepo.updateItemExtension({
        id,
        currentLayerCount: item.layerCount,
        encryptedData: ciphertext,
        decryptAt: newDecryptAt,
        roundNumber: BigInt(roundNumber),
    });

    return {
        success: true,
        decryptAt: newDecryptAt.getTime(),
        layerCount: item.layerCount + 1,
    };
}

export async function deleteItem(id: string): Promise<{ success: boolean }> {
    return { success: await itemRepo.deleteItemFromDb(id) };
}
