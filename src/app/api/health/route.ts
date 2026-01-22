import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

/**
 * Health Check Endpoint
 * Checks database connection and returns system status
 */
export async function GET(_request: NextRequest) {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: process.env.NODE_ENV === 'production' ? 'Service unavailable' : (error instanceof Error ? error.message : 'Unknown error')
            },
            { status: 503 }
        );
    }
}
