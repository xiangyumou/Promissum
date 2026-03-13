import { NextRequest } from 'next/server';
import { getItem, deleteItem } from '@/core/db';
import { withApiHandler, successResponse } from '@/lib/api-utils';

async function getHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;
    const item = await getItem(id);

    if (!item) {
        throw new Error('Item not found');
    }

    return successResponse(item);
}

async function deleteHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;
    const deleted = await deleteItem(id);

    if (!deleted) {
        throw new Error('Item not found');
    }

    return successResponse({ success: true });
}

export const GET = (req: NextRequest, ctx: unknown) => withApiHandler(() => getHandler(req, ctx));
export const DELETE = (req: NextRequest, ctx: unknown) => withApiHandler(() => deleteHandler(req, ctx));
