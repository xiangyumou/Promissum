/**
 * Stats Service Layer
 *
 * System-wide statistics for encrypted items.
 */

import { db } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import type { SystemStats } from '@/lib/types';

export async function getSystemStats(): Promise<SystemStats> {
    const now = new Date();

    // Get total count
    const totalResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items);
    const totalItems = totalResult[0]?.count || 0;

    // Get locked items (decryptAt > now)
    const lockedResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.decryptAt} > ${now}`);
    const lockedItems = lockedResult[0]?.count || 0;

    // Get counts by type
    const textResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.type} = 'text'`);
    const textCount = textResult[0]?.count || 0;

    const imageResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.type} = 'image'`);
    const imageCount = imageResult[0]?.count || 0;

    const unlockedItems = totalItems - lockedItems;

    const byType = {
        text: textCount,
        image: imageCount,
    };

    // Calculate average lock duration
    let avgLockDurationMinutes = 0;
    if (totalItems > 0) {
        const durationData = await db.select({
            createdAt: items.createdAt,
            decryptAt: items.decryptAt,
        }).from(items).limit(1000);

        if (durationData.length > 0) {
            const totalDuration = durationData.reduce(
                (sum, item) => sum + (item.decryptAt.getTime() - item.createdAt.getTime()),
                0
            );
            avgLockDurationMinutes = Math.round(totalDuration / durationData.length / 60000);
        }
    }

    // Get newest item timestamp
    const maxCreatedResult = await db.select({
        maxCreated: sql<number>`max(${items.createdAt})`,
    }).from(items);
    const newestItem = maxCreatedResult[0]?.maxCreated
        ? new Date(maxCreatedResult[0].maxCreated).getTime()
        : undefined;

    return {
        totalItems,
        lockedItems,
        unlockedItems,
        byType,
        avgLockDurationMinutes,
        newestItem,
    };
}
