import { NextResponse } from 'next/server';
import { getSystemStats } from '@/lib/services/stats/stats-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';

// GET /api/stats - Get system statistics
async function getHandler() {
    try {
        // Direct service function call - no HTTP!
        const stats = await getSystemStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({
            error: 'Failed to fetch statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Apply rate limiting
export const GET = withRateLimit(getHandler);
