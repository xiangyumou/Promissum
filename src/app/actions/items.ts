'use server';

import { revalidatePath } from 'next/cache';
import { db, itemsTable, listItems, getItem as getItemDb, deleteItem as deleteItemDb, getStats as getStatsDb } from '@/core/db';
import { encrypt } from '@/core/crypto';
import { saveFile, readFile, deleteFiles } from '@/lib/file-storage';
import { CreateItemSchema, FilterParamsSchema, ItemIdSchema, type FilterParams } from '@/lib/validation';
import type { ContentBundle, Item, SystemStats } from '@/lib/validation';
import { MAX_TOTAL_SIZE_BYTES, MAX_FILE_SIZE_BYTES } from '@/lib/constants';

export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Create a new encrypted item with file support
 */
export async function createItemAction(formData: FormData): Promise<ActionResult<Item>> {
    try {
        const durationStr = formData.get('durationMinutes');
        const decryptAtStr = formData.get('decryptAt');
        const metadataString = formData.get('metadata') as string;
        const text = formData.get('text') as string;

        let durationMinutes: number | undefined;
        let decryptAt: number | undefined;

        if (durationStr) durationMinutes = Number(durationStr);
        if (decryptAtStr) decryptAt = Number(decryptAtStr);

        const validated = CreateItemSchema.parse({
            durationMinutes,
            decryptAt,
            metadata: metadataString ? JSON.parse(metadataString) : undefined,
        });

        // Build ContentBundle from form data
        const bundle: ContentBundle = {
            version: 1,
            files: [],
        };

        // Extract text content
        if (text?.trim()) {
            bundle.text = text.trim();
        }

        // Extract files
        const files: File[] = [];
        const fileEntries = formData.getAll('files');
        const singleFile = formData.get('file');

        for (const entry of fileEntries) {
            if (entry instanceof File) files.push(entry);
        }
        if (singleFile instanceof File) files.push(singleFile);

        // Process and save files
        let totalSize = 0;
        if (bundle.text) {
            totalSize += Buffer.byteLength(bundle.text, 'utf-8');
        }

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return { success: false, error: `File "${file.name}" exceeds 5MB limit` };
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            totalSize += file.size;

            if (totalSize > MAX_TOTAL_SIZE_BYTES) {
                return { success: false, error: `Total content exceeds 10MB limit` };
            }

            // Save file to storage and get fileId
            const fileId = await saveFile(buffer);

            bundle.files.push({
                id: crypto.randomUUID(),
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
                size: file.size,
                fileId,
            });
        }

        // Validate: must have at least text or one file
        if (!bundle.text && bundle.files.length === 0) {
            return { success: false, error: 'Content is required: provide text or at least one file' };
        }

        // Calculate decrypt time
        let targetDecryptAt: Date;
        if (validated.decryptAt) {
            targetDecryptAt = new Date(validated.decryptAt);
            if (isNaN(targetDecryptAt.getTime()) || targetDecryptAt.getTime() <= Date.now()) {
                return { success: false, error: 'Unlock time must be in the future' };
            }
        } else {
            targetDecryptAt = new Date(Date.now() + validated.durationMinutes! * 60 * 1000);
        }

        // Generate content summary for display
        let contentSummary: string | null = null;
        if (bundle.text) {
            contentSummary = bundle.text.slice(0, 100);
        } else if (bundle.files.length > 0) {
            const fileNames = bundle.files.map(f => f.name).join(', ');
            contentSummary = fileNames.slice(0, 100);
        }

        // Convert bundle to buffer and encrypt
        const bundleJson = JSON.stringify(bundle);
        const dataToEncrypt = Buffer.from(bundleJson, 'utf-8');
        const { ciphertext, roundNumber } = await encrypt(dataToEncrypt, targetDecryptAt);

        // Save to database
        const [item] = await db.insert(itemsTable).values({
            id: crypto.randomUUID(),
            encryptedData: ciphertext,
            contentSummary,
            decryptAt: targetDecryptAt,
            roundNumber,
            metadata: JSON.stringify(validated.metadata ?? {}),
        }).returning();

        revalidatePath('/');

        return {
            success: true,
            data: {
                id: item.id!,
                unlocked: false,
                decrypt_at: item.decryptAt!.getTime(),
                created_at: item.createdAt!.getTime(),
                content_summary: item.contentSummary ?? null,
                metadata: validated.metadata ?? {},
            },
        };
    } catch (error) {
        console.error('Create item error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create item' };
    }
}

/**
 * Get a list of items with optional filtering
 */
export async function getItemsAction(filters?: FilterParams): Promise<ActionResult<{ items: Item[]; total: number }>> {
    try {
        const validatedFilters = filters ? FilterParamsSchema.parse(filters) : undefined;
        const result = await listItems(validatedFilters);
        return { success: true, data: result };
    } catch (error) {
        console.error('Get items error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch items' };
    }
}

/**
 * Get a single item by ID (with decrypted content if unlocked)
 */
export async function getItemAction(id: string): Promise<ActionResult<Item>> {
    try {
        ItemIdSchema.parse(id);
        const item = await getItemDb(id);

        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        // If unlocked and has content, read files from storage
        if (item.unlocked && item.content?.files) {
            for (const file of item.content.files) {
                try {
                    const buffer = await readFile(file.fileId);
                    // Add data field for client consumption
                    (file as { data?: string }).data = buffer.toString('base64');
                } catch (error) {
                    console.error(`Failed to read file ${file.fileId}:`, error);
                }
            }
        }

        return { success: true, data: item };
    } catch (error) {
        console.error('Get item error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch item' };
    }
}

/**
 * Delete an item by ID
 */
export async function deleteItemAction(id: string): Promise<ActionResult<void>> {
    try {
        ItemIdSchema.parse(id);

        // Get item first to find associated files
        const item = await getItemDb(id);

        if (item?.unlocked && item.content?.files) {
            // Delete associated files from storage
            const fileIds = item.content.files.map(f => f.fileId);
            await deleteFiles(fileIds);
        }

        await deleteItemDb(id);
        revalidatePath('/');

        return { success: true, data: undefined };
    } catch (error) {
        console.error('Delete item error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete item' };
    }
}

/**
 * Get system statistics
 */
export async function getStatsAction(): Promise<ActionResult<SystemStats>> {
    try {
        const stats = await getStatsDb();
        return { success: true, data: stats };
    } catch (error) {
        console.error('Get stats error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stats' };
    }
}
