import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/preferences/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/client';

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
    default: {
        device: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        userPreferences: {
            upsert: vi.fn(),
        },
    },
}));

// Mock broadcastEvent
vi.mock('@/app/api/events/route', () => ({
    broadcastEvent: vi.fn(),
}));

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
                preferences: mockPreferences,
            };

            (prisma.device.findUnique as any).mockResolvedValue(mockDevice);

            const req = new NextRequest('http://localhost/api/preferences?deviceId=device-123');
            const res = await GET(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual(mockPreferences);
            expect(prisma.device.findUnique).toHaveBeenCalledWith({
                where: { fingerprint: 'device-123' },
                include: { preferences: true },
            });
        });

        it('should create new device and return default preferences if not found', async () => {
            (prisma.device.findUnique as any).mockResolvedValue(null);
            const mockNewDevice = {
                id: '2',
                fingerprint: 'new-device',
                preferences: { defaultDurationMinutes: 60 },
            };
            (prisma.device.create as any).mockResolvedValue(mockNewDevice);

            const req = new NextRequest('http://localhost/api/preferences?deviceId=new-device');
            const res = await GET(req);

            expect(res.status).toBe(200);
            expect(prisma.device.create).toHaveBeenCalled();
        });
    });

    describe('POST', () => {
        it('should update preferences and return updated data', async () => {
            const payload = {
                deviceId: 'device-123',
                defaultDurationMinutes: 120,
                privacyMode: true,
            };

            const mockDevice = { id: '1', fingerprint: 'device-123' };
            (prisma.device.findUnique as any).mockResolvedValue(mockDevice);

            const mockUpdatedPreferences = {
                ...payload,
                id: 'pref-1',
                themeConfig: '{}',
            };
            (prisma.userPreferences.upsert as any).mockResolvedValue(mockUpdatedPreferences);

            const req = new NextRequest('http://localhost/api/preferences', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const res = await POST(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual(mockUpdatedPreferences);

            expect(prisma.userPreferences.upsert).toHaveBeenCalledWith({
                where: { deviceId: '1' },
                create: expect.objectContaining({ deviceId: '1', defaultDurationMinutes: 120 }),
                update: expect.objectContaining({ defaultDurationMinutes: 120 }),
            });
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
