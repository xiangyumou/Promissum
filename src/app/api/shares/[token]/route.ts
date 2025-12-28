import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import type { ShareData, UpdateShareRequest } from '@/lib/types';

// GET /api/shares/[token] - Get share details and validate access
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const share = await prisma.sharedItem.findUnique({
            where: { shareToken: token }
        });

        if (!share) {
            return NextResponse.json(
                { error: 'Share not found' },
                { status: 404 }
            );
        }

        // Check if share has expired
        if (share.expiresAt && share.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Share has expired' },
                { status: 410 } // Gone
            );
        }

        // Update last accessed time
        await prisma.sharedItem.update({
            where: { id: share.id },
            data: { lastAccessedAt: new Date() }
        });

        const shareData: ShareData = {
            id: share.id,
            itemId: share.itemId,
            shareToken: share.shareToken,
            permission: share.permission as ShareData['permission'],
            createdBy: share.createdBy,
            expiresAt: share.expiresAt ? share.expiresAt.getTime() : null,
            createdAt: share.createdAt.getTime(),
            lastAccessedAt: new Date().getTime()
        };

        return NextResponse.json(shareData);
    } catch (error) {
        console.error('Error fetching share:', error);
        return NextResponse.json(
            { error: 'Failed to fetch share' },
            { status: 500 }
        );
    }
}

// PATCH /api/shares/[token] - Update share permissions or expiration
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const body: UpdateShareRequest = await request.json();

        const share = await prisma.sharedItem.findUnique({
            where: { shareToken: token }
        });

        if (!share) {
            return NextResponse.json(
                { error: 'Share not found' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: any = {};

        if (body.permission !== undefined) {
            const validPermissions = ['view', 'view-extend', 'full'];
            if (!validPermissions.includes(body.permission)) {
                return NextResponse.json(
                    { error: 'Invalid permission' },
                    { status: 400 }
                );
            }
            updateData.permission = body.permission;
        }

        if (body.expiresAt !== undefined) {
            updateData.expiresAt = body.expiresAt === null ? null : new Date(body.expiresAt);
        }

        // Update share
        const updatedShare = await prisma.sharedItem.update({
            where: { id: share.id },
            data: updateData
        });

        const shareData: ShareData = {
            id: updatedShare.id,
            itemId: updatedShare.itemId,
            shareToken: updatedShare.shareToken,
            permission: updatedShare.permission as ShareData['permission'],
            createdBy: updatedShare.createdBy,
            expiresAt: updatedShare.expiresAt ? updatedShare.expiresAt.getTime() : null,
            createdAt: updatedShare.createdAt.getTime(),
            lastAccessedAt: updatedShare.lastAccessedAt ? updatedShare.lastAccessedAt.getTime() : null
        };

        return NextResponse.json(shareData);
    } catch (error) {
        console.error('Error updating share:', error);
        return NextResponse.json(
            { error: 'Failed to update share' },
            { status: 500 }
        );
    }
}

// DELETE /api/shares/[token] - Revoke a share
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const share = await prisma.sharedItem.findUnique({
            where: { shareToken: token }
        });

        if (!share) {
            return NextResponse.json(
                { error: 'Share not found' },
                { status: 404 }
            );
        }

        await prisma.sharedItem.delete({
            where: { id: share.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting share:', error);
        return NextResponse.json(
            { error: 'Failed to delete share' },
            { status: 500 }
        );
    }
}
