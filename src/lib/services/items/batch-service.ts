/**
 * Batch Service Layer
 *
 * Batch operations for multiple items.
 */

import pLimit from 'p-limit';
import { createItem, getItemById, deleteItem } from './item-service';

// Limit concurrent operations to prevent overwhelming the system
const limit = pLimit(10);

/**
 * Create multiple items in batch
 */
export async function batchCreateItems(items: Array<{
    type: 'text' | 'image';
    content: string;
    durationMinutes?: number;
    decryptAt?: number;
    metadata?: Record<string, unknown>;
}>): Promise<Awaited<ReturnType<typeof createItem>>[]> {
    const results = await Promise.all(
        items.map(item => limit(() => createItem(item)))
    );
    return results;
}

/**
 * Get multiple items by IDs in batch
 */
export async function batchGetItems(ids: string[]): Promise<Awaited<ReturnType<typeof getItemById>>[]> {
    const results = await Promise.all(
        ids.map(id => limit(() => getItemById(id)))
    );
    return results;
}

/**
 * Delete multiple items in batch
 */
export async function batchDeleteItems(ids: string[]): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = [];

    const results = await Promise.allSettled(
        ids.map(id => limit(() => deleteItem(id)))
    );

    for (const result of results) {
        if (result.status === 'rejected') {
            errors.push(result.reason?.message || 'Unknown error');
        }
    }

    return {
        deleted: results.filter(r => r.status === 'fulfilled').length,
        errors,
    };
}
