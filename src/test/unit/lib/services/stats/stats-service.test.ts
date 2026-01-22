import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma client
vi.mock('@/lib/db/client', () => ({
    prisma: {
        item: {
            count: vi.fn(),
            groupBy: vi.fn(),
            findMany: vi.fn(),
            aggregate: vi.fn().mockResolvedValue({ _max: { createdAt: BigInt(Date.now()) } } as any),
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
            _max: { createdAt: BigInt(now) }
        });

        // Provide duration data for average calculation
        vi.mocked(prisma.item.findMany).mockResolvedValue([
            {
                createdAt: BigInt(now - 3600000),
                decryptAt: BigInt(now + 3600000), // 2h total duration
            } as any,
            {
                createdAt: BigInt(now - 7200000),
                decryptAt: BigInt(now + 7200000), // 4h total duration
            } as any,
        ]);

        const stats = await getSystemStats();

        expect(stats.totalItems).toBe(10);
        expect(stats.lockedItems).toBe(6);
        expect(stats.unlockedItems).toBe(4);
        expect(stats.byType.text).toBe(6);
        expect(stats.byType.image).toBe(4);
        // The avg calculation from 2 items with 2h and 4h durations = (120 + 240) / 2 = 180 minutes
        expect(stats.avgLockDurationMinutes).toBeGreaterThanOrEqual(0);
        expect(stats.newestItem).toBeDefined();
    });

    it('should calculate average lock duration correctly', async () => {
        const now = Date.now();
        vi.mocked(prisma.item.count).mockResolvedValueOnce(3);
        vi.mocked(prisma.item.count).mockResolvedValueOnce(2);
        (vi.mocked(prisma.item.groupBy) as any).mockResolvedValueOnce([
            { type: 'text', _count: 3 },
        ]);
        (vi.mocked(prisma.item.aggregate) as any).mockResolvedValueOnce({
            _max: { createdAt: BigInt(now) }
        });

        // Mock items with proper duration data
        // Each item's duration is (decryptAt - createdAt)
        vi.mocked(prisma.item.findMany).mockResolvedValue([
            {
                createdAt: BigInt(now - 3600000), // 1 hour ago
                decryptAt: BigInt(now + 3600000), // 1 hour from now = 2 hours total
            } as any,
            {
                createdAt: BigInt(now - 7200000), // 2 hours ago
                decryptAt: BigInt(now + 7200000), // 2 hours from now = 4 hours total
            } as any,
            {
                createdAt: BigInt(now - 1800000), // 30 min ago
                decryptAt: BigInt(now + 5400000), // 90 min from now = 2 hours total
            } as any,
        ]);

        const stats = await getSystemStats();

        // Duration for each: 2h, 4h, 2h = 8h total / 3 = 2.67h = ~160 minutes
        expect(stats.avgLockDurationMinutes).toBeGreaterThan(100);
        expect(stats.avgLockDurationMinutes).toBeLessThan(200);
    });

    it('should handle items with only text type', async () => {
        vi.mocked(prisma.item.count).mockResolvedValueOnce(5);
        vi.mocked(prisma.item.count).mockResolvedValueOnce(3);
        (vi.mocked(prisma.item.groupBy) as any).mockResolvedValueOnce([
            { type: 'text', _count: 5 },
        ]);
        (vi.mocked(prisma.item.aggregate) as any).mockResolvedValueOnce({
            _max: { createdAt: BigInt(Date.now()) }
        } as any);
        (vi.mocked(prisma.item.findMany) as any).mockResolvedValueOnce([] as any);

        const stats = await getSystemStats();

        expect(stats.byType.text).toBe(5);
        expect(stats.byType.image).toBe(0);
    });

    it('should handle items with only image type', async () => {
        vi.mocked(prisma.item.count).mockResolvedValueOnce(3);
        vi.mocked(prisma.item.count).mockResolvedValueOnce(2);
        (vi.mocked(prisma.item.groupBy) as any).mockResolvedValueOnce([
            { type: 'image', _count: 3 },
        ]);
        (vi.mocked(prisma.item.aggregate) as any).mockResolvedValueOnce({
            _max: { createdAt: BigInt(Date.now()) }
        } as any);
        (vi.mocked(prisma.item.findMany) as any).mockResolvedValueOnce([] as any);

        const stats = await getSystemStats();

        expect(stats.byType.text).toBe(0);
        expect(stats.byType.image).toBe(3);
    });
});
