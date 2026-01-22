import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/stats/route';
import { NextRequest } from 'next/server';

// Mock the service function
vi.mock('@/lib/services/stats/stats-service', () => ({
    getSystemStats: vi.fn(),
}));

vi.mock('@/lib/services/rate-limiting/wrapper', () => ({
    withRateLimit: (handler: any) => handler,
}));

import { getSystemStats } from '@/lib/services/stats/stats-service';

describe('Stats API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return system statistics', async () => {
        const mockStats = {
            totalItems: 100,
            lockedItems: 60,
            unlockedItems: 40,
            byType: {
                text: 70,
                image: 30,
            },
            avgLockDurationMinutes: 120,
            newestItem: Date.now(),
        };

        vi.mocked(getSystemStats).mockResolvedValue(mockStats);

        const request = new NextRequest('http://localhost/api/stats');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalItems).toBe(100);
        expect(data.lockedItems).toBe(60);
        expect(data.unlockedItems).toBe(40);
        expect(data.byType.text).toBe(70);
        expect(data.byType.image).toBe(30);
        expect(data.avgLockDurationMinutes).toBe(120);
        expect(data.newestItem).toBeDefined();
    });

    it('should handle empty database', async () => {
        const mockStats = {
            totalItems: 0,
            lockedItems: 0,
            unlockedItems: 0,
            byType: {
                text: 0,
                image: 0,
            },
            avgLockDurationMinutes: 0,
            newestItem: undefined,
        };

        vi.mocked(getSystemStats).mockResolvedValue(mockStats);

        const request = new NextRequest('http://localhost/api/stats');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalItems).toBe(0);
        expect(data.newestItem).toBeUndefined();
    });

    it('should return error on service failure', async () => {
        vi.mocked(getSystemStats).mockRejectedValue(new Error('Database error'));

        const request = new NextRequest('http://localhost/api/stats');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch statistics');
    });
});
