import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma client
vi.mock('@/lib/db/client', () => ({
    prisma: {
        item: {
            count: vi.fn(),
            groupBy: vi.fn(),
            findMany: vi.fn(),
            aggregate: vi.fn().mockResolvedValue({ _max: { createdAt: new Date() } } as any),
        },
    },
}));

import { getSystemStats } from '@/lib/services/stats/stats-service';
import { prisma } from '@/lib/db/client';

describe('Stats Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return system stats with no items', async () => {
        vi.mocked(prisma.item.count).mockResolvedValueOnce(0);
        vi.mocked(prisma.item.count).mockResolvedValueOnce(0);
        (vi.mocked(prisma.item.groupBy) as any).mockResolvedValueOnce([]);
        (vi.mocked(prisma.item.aggregate) as any).mockResolvedValueOnce({ _max: { createdAt: null } });
        (vi.mocked(prisma.item.findMany) as any).mockResolvedValueOnce([]);

        const stats = await getSystemStats();

        expect(stats).toEqual({
            totalItems: 0,
            lockedItems: 0,
            unlockedItems: 0,
            byType: { text: 0, image: 0 },
            avgLockDurationMinutes: 0,
            newestItem: undefined,
        });
    });

    it('should return system stats with mixed items', async () => {
        const now = Date.now();
        vi.mocked(prisma.item.count).mockResolvedValueOnce(10);
        vi.mocked(prisma.item.count).mockResolvedValueOnce(6); // locked
        (vi.mocked(prisma.item.groupBy) as any).mockResolvedValueOnce([
            { type: 'text', _count: 6 },
            { type: 'image', _count: 4 },
        ]);
        (vi.mocked(prisma.item.aggregate) as any).mockResolvedValueOnce({
            _max: { createdAt: new Date(Date.now()) }
        } as any);
        (vi.mocked(prisma.item.findMany) as any).mockResolvedValueOnce([] as any);

        const stats = await getSystemStats();

        expect(stats.byType.text).toBe(6);
        expect(stats.byType.image).toBe(4);
    });

    it('should handle items with only image type', async () => {
        vi.mocked(prisma.item.count).mockResolvedValueOnce(3);
        vi.mocked(prisma.item.count).mockResolvedValueOnce(2);
        (vi.mocked(prisma.item.groupBy) as any).mockResolvedValueOnce([
            { type: 'image', _count: 3 },
        ]);
        (vi.mocked(prisma.item.aggregate) as any).mockResolvedValueOnce({
            _max: { createdAt: new Date() }
        } as any);
        (vi.mocked(prisma.item.findMany) as any).mockResolvedValueOnce([] as any);

        const stats = await getSystemStats();

        expect(stats.byType.text).toBe(0);
        expect(stats.byType.image).toBe(3);
    });
});
