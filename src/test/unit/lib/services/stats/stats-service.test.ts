import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Drizzle
const mockDb = {
    select: vi.fn(),
};

vi.mock('@/lib/db/client', () => ({
    db: mockDb,
}));

import { getSystemStats } from '@/lib/services/stats/stats-service';

const createMockQuery = () => {
    const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue([]),
    };
    return chain;
};

describe('Stats Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return system stats with no items', async () => {
        // Mock all the select queries
        mockDb.select
            .mockReturnValueOnce(createMockQuery().from().limit([{ count: 0 }]))  // total
            .mockReturnValueOnce(createMockQuery().from().where().limit([{ count: 0 }]))  // locked
            .mockReturnValueOnce(createMockQuery().from().where().limit([{ count: 0 }]))  // text
            .mockReturnValueOnce(createMockQuery().from().where().limit([{ count: 0 }]))  // image
            .mockReturnValueOnce(createMockQuery().from().limit([]))  // duration
            .mockReturnValueOnce(createMockQuery().from().limit([{ maxCreated: null }]));  // newest

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
        const mockQuery = () => ({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn(),
        });

        // Set up mock return values
        const queries = [
            { from: () => ({ limit: () => [{ count: 10 }] }) },  // total
            { from: () => ({ where: () => ({ limit: () => [{ count: 6 }] }) }) },  // locked
            { from: () => ({ where: () => ({ limit: () => [{ count: 6 }] }) }) },  // text
            { from: () => ({ where: () => ({ limit: () => [{ count: 4 }] }) }) },  // image
            { from: () => ({ limit: () => [] }) },  // duration
            { from: () => ({ limit: () => [{ maxCreated: now }] }) },  // newest
        ];

        let callIndex = 0;
        mockDb.select.mockImplementation(() => queries[callIndex++]);

        const stats = await getSystemStats();

        expect(stats.totalItems).toBe(10);
        expect(stats.lockedItems).toBe(6);
        expect(stats.unlockedItems).toBe(4);
    });

    it('should handle items with only image type', async () => {
        const now = Date.now();

        const queries = [
            { from: () => ({ limit: () => [{ count: 3 }] }) },  // total
            { from: () => ({ where: () => ({ limit: () => [{ count: 2 }] }) }) },  // locked
            { from: () => ({ where: () => ({ limit: () => [{ count: 0 }] }) }) },  // text
            { from: () => ({ where: () => ({ limit: () => [{ count: 3 }] }) }) },  // image
            { from: () => ({ limit: () => [] }) },  // duration
            { from: () => ({ limit: () => [{ maxCreated: now }] }) },  // newest
        ];

        let callIndex = 0;
        mockDb.select.mockImplementation(() => queries[callIndex++]);

        const stats = await getSystemStats();

        expect(stats.byType.text).toBe(0);
        expect(stats.byType.image).toBe(3);
    });
});
