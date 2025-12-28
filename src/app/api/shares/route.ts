import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import type { CreateShareRequest, ShareData } from '@/lib/types';
import { nanoid } from 'nanoid';

// GET /api/shares?itemId={id} - List all shares for an item
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');

        if (!itemId) {
            return NextResponse.json(
                { error: 'itemId is required' },
                { status: 400 }
            );
        }

        const shares = await prisma.sharedItem.findMany({
            where: { itemId },
            orderBy: { createdAt: 'desc' }
        });

        // Convert to ShareData format
        const shareData: ShareData[] = shares.map(share => ({
            id: share.id,
            itemId: share.itemId,
            shareToken: share.shareToken,
            permission: share.permission as ShareData['permission'],
            createdBy: share.createdBy,
            expiresAt: share.expiresAt ? share.expiresAt.getTime() : null,
            createdAt: share.createdAt.getTime(),
            lastAccessedAt: share.lastAccessedAt ? share.lastAccessedAt.getTime() : null
        }));

        return NextResponse.json(shareData);
    } catch (error) {
        console.error('Error fetching shares:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shares' },
            { status: 500 }
        );
    }
}

// POST /api/shares - Create a new share
export async function POST(request: NextRequest) {
    try {
        const body: CreateShareRequest = await request.json();
        const { itemId, permission, expiresAt } = body;

        if (!itemId || !permission) {
            return NextResponse.json(
                { error: 'itemId and permission are required' },
                { status: 400 }
            );
        }

        // Validate permission
        const validPermissions = ['view', 'view-extend', 'full'];
        if (!validPermissions.includes(permission)) {
            return NextResponse.json(
                { error: 'Invalid permission. Must be view, view-extend, or full' },
                { status: 400 }
            );
        }

        // Generate unique share token
        const shareToken = nanoid(16);

        // Get device ID from session/headers (simplified for now)
        const deviceId = 'default-device'; // TODO: Get from actual session

        // Create share
        const share = await prisma.sharedItem.create({
            data: {
                itemId,
                shareToken,
                permission,
                createdBy: deviceId,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        const shareData: ShareData = {
            id: share.id,
            itemId: share.itemId,
            shareToken: share.shareToken,
            permission: share.permission as ShareData['permission'],
            createdBy: share.createdBy,
            expiresAt: share.expiresAt ? share.expiresAt.getTime() : null,
            createdAt: share.createdAt.getTime(),
            lastAccessedAt: null
        };

        return NextResponse.json(shareData, { status: 201 });
    } catch (error) {
        console.error('Error creating share:', error);
        return NextResponse.json(
            { error: 'Failed to create share' },
            { status: 500 }
        );
    }
}
