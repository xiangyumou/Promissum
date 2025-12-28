import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/sessions/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/client';

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
    default: {
        device: {
            findUnique: vi.fn(),
        },
        activeSession: {
            findMany: vi.fn(),
            upsert: vi.fn(),
            deleteMany: vi.fn(),
        },
    },
}));

describe('Sessions API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 400 if itemId is missing', async () => {
            const req = new NextRequest('http://localhost/api/sessions');
            const res = await GET(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('itemId is required');
        });

        it('should return active sessions for an item', async () => {
            const mockSessions = [
                { id: '1', deviceId: 'dev1', itemId: 'item1', lastActive: new Date() },
            ];
            (prisma.activeSession.findMany as any).mockResolvedValue(mockSessions);

            const req = new NextRequest('http://localhost/api/sessions?itemId=item1');
            const res = await GET(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveLength(1);
            expect(data[0].id).toBe('1');
        });
    });

    describe('POST', () => {
        it('should register connection and return session', async () => {
            const payload = { deviceId: 'dev1', itemId: 'item1' };
            const mockDevice = { id: 'dev_db_id', fingerprint: 'dev1' };
            const mockSession = { id: 'sess1', ...payload };

            (prisma.device.findUnique as any).mockResolvedValue(mockDevice);
            (prisma.activeSession.upsert as any).mockResolvedValue(mockSession);

            const req = new NextRequest('http://localhost/api/sessions', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const res = await POST(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.id).toBe('sess1');

            expect(prisma.activeSession.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    deviceId_itemId: { deviceId: 'dev_db_id', itemId: 'item1' }
                }
            }));
        });

        it('should return 404 if device not found', async () => {
            (prisma.device.findUnique as any).mockResolvedValue(null);

            const req = new NextRequest('http://localhost/api/sessions', {
                method: 'POST',
                body: JSON.stringify({ deviceId: 'unknown', itemId: 'item1' }),
            });

            const res = await POST(req);
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE', () => {
        it('should remove session on cleanup', async () => {
            (prisma.device.findUnique as any).mockResolvedValue({ id: 'dev_db_id' });
            (prisma.activeSession.deleteMany as any).mockResolvedValue({ count: 1 });

            const req = new NextRequest('http://localhost/api/sessions?deviceId=dev1&itemId=item1');
            const res = await DELETE(req);

            expect(res.status).toBe(200);
            expect(prisma.activeSession.deleteMany).toHaveBeenCalledWith({
                where: { deviceId: 'dev_db_id', itemId: 'item1' }
            });
        });
    });
});
