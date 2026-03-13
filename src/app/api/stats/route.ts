import { withApiHandler, successResponse } from '@/lib/api-utils';
import { getStats } from '@/core/db';

async function getHandler() {
    const stats = await getStats();
    return successResponse(stats);
}

export const GET = () => withApiHandler(getHandler);
