import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Drizzle - must be before imports
const mockSelect = vi.fn();

vi.mock('@/lib/db/client', () => ({
    db: {
        select: (...args: unknown[]) => mockSelect(...args),
    },
}));

import { getSystemStats } from '@/lib/services/stats/stats-service';

describe('Stats Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return system stats with no items', async () => {
        let callCount = 0;
        mockSelect.mockImplementation(() => {
            callCount++;
            const queries = [
                { from: () => Promise.resolve([{ count: 0 }]) },  // total
                { from: () => ({ where: () => Promise.resolve([{ count: 0 }]) }) },  // locked
                { from: () => ({ where: () => Promise.resolve([{ count: 0 }]) }) },  // text
                { from: () => ({ where: () => Promise.resolve([{ count: 0 }]) }) },  // image
                { from: () => ({ limit: () => Promise.resolve([]) }) },  // duration - has .limit()
                { from: () => Promise.resolve([{ maxCreated: null }]) },  // newest
            ];
            return queries[callCount - 1] || queries[0];
        });

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

        let callCount = 0;
        mockSelect.mockImplementation(() => {
            callCount++;
            const queries = [
                { from: () => Promise.resolve([{ count: 10 }]) },  // total
                { from: () => ({ where: () => Promise.resolve([{ count: 6 }]) }) },  // locked
                { from: () => ({ where: () => Promise.resolve([{ count: 6 }]) }) },  // text
                { from: () => ({ where: () => Promise.resolve([{ count: 4 }]) }) },  // image
                { from: () => ({ limit: () => Promise.resolve([]) }) },  // duration - has .limit()
                { from: () => Promise.resolve([{ maxCreated: now }]) },  // newest
            ];
            return queries[callCount - 1] || queries[0];
        });

        const stats = await getSystemStats();

        expect(stats.totalItems).toBe(10);
        expect(stats.lockedItems).toBe(6);
        expect(stats.unlockedItems).toBe(4);
    });

    it('should handle items with only image type', async () => {
        const now = Date.now();

        let callCount = 0;
        mockSelect.mockImplementation(() => {
            callCount++;
            const queries = [
                { from: () => Promise.resolve([{ count: 3 }]) },  // total
                { from: () => ({ where: () => Promise.resolve([{ count: 2 }]) }) },  // locked
                { from: () => ({ where: () => Promise.resolve([{ count: 0 }]) }) },  // text
                { from: () => ({ where: () => Promise.resolve([{ count: 3 }]) }) },  // image
                { from: () => ({ limit: () => Promise.resolve([]) }) },  // duration - has .limit()
                { from: () => Promise.resolve([{ maxCreated: now }]) },  // newest
            ];
            return queries[callCount - 1] || queries[0];
        });

        const stats = await getSystemStats();

        expect(stats.byType.text).toBe(0);
        expect(stats.byType.image).toBe(3);
    });
});
