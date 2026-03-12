import { NextResponse } from 'next/server';
import { getSystemStats } from '@/lib/services/stats/stats-service';

// GET /api/stats - Get system statistics
async function getHandler() {
    try {
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

// Export without rate limiting
export const GET = getHandler;
