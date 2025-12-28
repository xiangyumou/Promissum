/**
 * API Route: /api/sessions
 * 
 * Manages active viewing sessions for presence awareness.
 * Tracks which devices are currently viewing which items.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { z } from 'zod';

const SessionSchema = z.object({
    deviceId: z.string(),
    itemId: z.string(),
});

/**
 * GET /api/sessions?itemId=xxx
 * Get all active sessions for an item (which devices are viewing it)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');

        if (!itemId) {
            return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
        }

        // Find active sessions (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const sessions = await prisma.activeSession.findMany({
            where: {
                itemId,
                lastActive: {
                    gte: fiveMinutesAgo,
                },
            },
            include: {
                device: true,
            },
        });

        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sessions
 * Register or update active session
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = SessionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid session data', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { deviceId, itemId } = validation.data;

        // Find device
        const device = await prisma.device.findUnique({
            where: { fingerprint: deviceId },
        });

        if (!device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }

        // Upsert session
        const session = await prisma.activeSession.upsert({
            where: {
                deviceId_itemId: {
                    deviceId: device.id,
                    itemId,
                },
            },
            create: {
                deviceId: device.id,
                itemId,
            },
            update: {
                lastActive: new Date(),
            },
        });

        return NextResponse.json(session);
    } catch (error) {
        console.error('Error creating/updating session:', error);
        return NextResponse.json(
            { error: 'Failed to create/update session' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/sessions?deviceId=xxx&itemId=xxx
 * Remove active session when user navigates away
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');
        const itemId = searchParams.get('itemId');

        if (!deviceId || !itemId) {
            return NextResponse.json(
                { error: 'deviceId and itemId are required' },
                { status: 400 }
            );
        }

        const device = await prisma.device.findUnique({
            where: { fingerprint: deviceId },
        });

        if (!device) {
            return NextResponse.json({ success: true }); // Already gone, that's fine
        }

        await prisma.activeSession.deleteMany({
            where: {
                deviceId: device.id,
                itemId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
