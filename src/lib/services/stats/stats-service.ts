/**
 * Stats Service Layer
 *
 * System-wide statistics for encrypted items.
 */

import { prisma } from '@/lib/db/client';
import type { SystemStats } from '@/lib/types';

export async function getSystemStats(): Promise<SystemStats> {
    const now = new Date();

    const [totalItems, lockedItems, typeGroups, maxCreatedAt] = await Promise.all([
        prisma.item.count(),
        prisma.item.count({ where: { decryptAt: { gt: now } } }),
        prisma.item.groupBy({
            by: ['type'],
            _count: true,
        }),
        prisma.item.aggregate({
            _max: {
                createdAt: true,
            },
        }),
    ]);

    const unlockedItems = totalItems - lockedItems;

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

    let avgLockDurationMinutes = 0;
    if (totalItems > 0) {
        const durationData = await prisma.item.findMany({
            select: {
                createdAt: true,
                decryptAt: true,
            },
            take: 1000,
        });

        if (durationData.length > 0) {
            const totalDuration = durationData.reduce(
                (sum, item) => sum + (item.decryptAt.getTime() - item.createdAt.getTime()),
                0
            );
            avgLockDurationMinutes = Math.round(totalDuration / durationData.length / 60000);
        }
    }

    const newestItem = maxCreatedAt._max.createdAt
        ? maxCreatedAt._max.createdAt.getTime()
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
