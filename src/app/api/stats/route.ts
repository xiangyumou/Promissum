import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/stats - Get system statistics
export async function GET() {
    try {
        const stats = await apiClient.getStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching stats from API:', error);
        return NextResponse.json({
            error: 'Failed to fetch statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
