import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/stats/route';
import { apiClient } from '@/lib/api-client';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
    apiClient: {
        getStats: vi.fn(),
    }
}));

describe('Stats API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and return statistics', async () => {
        const mockStats = {
            totalItems: 10,
            lockedItems: 7,
            unlockedItems: 3,
            byType: { text: 5, image: 5 },
            avgLockDurationMinutes: 120
        };
        (apiClient.getStats as any).mockResolvedValue(mockStats);

        const res = await GET();

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual(mockStats);
        expect(apiClient.getStats).toHaveBeenCalled();
    });

    it('should return 500 error on API failure', async () => {
        (apiClient.getStats as any).mockRejectedValue(new Error('Stats Error'));

        const res = await GET();

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error).toBe('Failed to fetch statistics');
    });
});
