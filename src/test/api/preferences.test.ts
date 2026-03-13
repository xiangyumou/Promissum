import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/preferences/route';
import { NextRequest } from 'next/server';

// Mock Drizzle - factory must be self-contained
vi.mock('@/lib/db/client', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
    },
}));

// Import the mocked db after vi.mock
import { db as dbMock } from '@/lib/db/client';

const createMockQuery = () => {
    const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue([]),
        values: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
    };
    return chain;
};

describe('Preferences API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 400 if deviceId is missing', async () => {
            const req = new NextRequest('http://localhost/api/preferences');
            const res = await GET(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('deviceId is required');
        });

        it('should return preferences for existing device', async () => {
            const mockPreferences = {
                deviceId: 'device-123',
                defaultDurationMinutes: 60,
                themeConfig: '{}',
            };
            const mockDevice = {
                id: '1',
                fingerprint: 'device-123',
            };

            // First call: find device
            const deviceQuery = createMockQuery();
            deviceQuery.limit.mockResolvedValueOnce([mockDevice]);

            // Second call: find preferences
            const prefQuery = createMockQuery();
            prefQuery.limit.mockResolvedValueOnce([mockPreferences]);

            (dbMock.select as ReturnType<typeof vi.fn>)
                .mockReturnValueOnce(deviceQuery)
                .mockReturnValueOnce(prefQuery);

            const req = new NextRequest('http://localhost/api/preferences?deviceId=device-123');
            const res = await GET(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual(mockPreferences);
        });

        it('should create new device and return default preferences if not found', async () => {
            // Device not found
            const deviceQuery = createMockQuery();
            deviceQuery.limit.mockReturnValueOnce([]);

            // New preferences created
            const prefQuery = createMockQuery();
            prefQuery.limit.mockResolvedValueOnce([{ defaultDurationMinutes: 60 }]);

            (dbMock.select as ReturnType<typeof vi.fn>)
                .mockReturnValueOnce(deviceQuery)
                .mockReturnValueOnce(prefQuery);

            (dbMock.insert as ReturnType<typeof vi.fn>).mockReturnValue(createMockQuery());

            const req = new NextRequest('http://localhost/api/preferences?deviceId=new-device');
            const res = await GET(req);

            expect(res.status).toBe(200);
            expect(dbMock.insert).toHaveBeenCalled();
        });
    });

    describe('POST', () => {
        it('should update preferences and return updated data', async () => {
            const payload = {
                deviceId: 'device-123',
                defaultDurationMinutes: 120,
            };

            const mockDevice = { id: '1', fingerprint: 'device-123' };

            // Find device
            const deviceQuery = createMockQuery();
            deviceQuery.limit.mockReturnValueOnce([mockDevice]);

            // Find existing preferences
            const prefQuery = createMockQuery();
            prefQuery.limit.mockReturnValueOnce([{ id: 'pref-1' }]);

            (dbMock.select as ReturnType<typeof vi.fn>)
                .mockReturnValueOnce(deviceQuery)
                .mockReturnValueOnce(prefQuery);

            // Update preferences
            const updateQuery = createMockQuery();
            (dbMock.update as ReturnType<typeof vi.fn>).mockReturnValue(updateQuery);

            // Return updated preferences
            const finalPrefQuery = createMockQuery();
            finalPrefQuery.limit.mockResolvedValueOnce([{ ...payload, id: 'pref-1', themeConfig: '{}' }]);
            (dbMock.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(finalPrefQuery);

            const req = new NextRequest('http://localhost/api/preferences', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const res = await POST(req);
            expect(res.status).toBe(200);
        });

        it('should return 400 for invalid data', async () => {
            const payload = {
                deviceId: 'device-123',
                defaultDurationMinutes: -5, // Invalid: must be min 1
            };

            const req = new NextRequest('http://localhost/api/preferences', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Invalid preferences data');
        });
    });
});
