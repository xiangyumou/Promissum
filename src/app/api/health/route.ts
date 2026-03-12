import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

/**
 * Health Check Endpoint
 * Checks database connection and returns system status
 */
export async function GET(_request: NextRequest) {
    try {
        // Check database connection with a simple query
        db.run(sql`SELECT 1`);

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
