/**
 * Stats Service Layer
 *
 * System-wide statistics for encrypted items.
 */

import { prisma } from '@/lib/db/client';
import type { SystemStats } from '@/lib/types';

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
    const now = Date.now();
    const nowBigInt = BigInt(now);

    // Use efficient aggregate queries
    const [totalItems, lockedItems, typeGroups, maxCreatedAt] = await Promise.all([
        // Total count
        prisma.item.count(),
        // Locked items count (decryptAt > now)
        prisma.item.count({ where: { decryptAt: { gt: nowBigInt } } }),
        // Group by type
        prisma.item.groupBy({
            by: ['type'],
            _count: true,
        }),
        // Get newest item timestamp
        prisma.item.aggregate({
            _max: {
                createdAt: true,
            },
        }),
    ]);

    // Calculate unlocked items
    const unlockedItems = totalItems - lockedItems;

    // Process type breakdown
    const byType = {
        text: 0,
        image: 0,
    };
    for (const group of typeGroups) {
        if (group.type === 'text') {
            byType.text = group._count;
        } else if (group.type === 'image') {
            byType.image = group._count;
        }
    }

    // For average lock duration, compute from a sample
    let avgLockDurationMinutes = 0;
    if (totalItems > 0) {
        // Fetch only the fields needed for duration calculation
        const durationData = await prisma.item.findMany({
            select: {
                createdAt: true,
                decryptAt: true,
            },
            take: 1000, // Sample at most 1000 items for average calculation
        });

        if (durationData.length > 0) {
            const totalDuration = durationData.reduce(
                (sum, item) => sum + (Number(item.decryptAt) - Number(item.createdAt)),
                0
            );
            avgLockDurationMinutes = Math.round(totalDuration / durationData.length / 60000);
        }
    }

    // Get newest item timestamp
    const newestItem = maxCreatedAt._max.createdAt
        ? Number(maxCreatedAt._max.createdAt)
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
