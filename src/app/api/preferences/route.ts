/**
 * API Route: /api/preferences
 *
 * DEPRECATED: Settings are now stored in localStorage via SettingsStore.
 * This route is kept for backward compatibility but returns empty responses.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/preferences
 * Returns empty object - settings now stored in localStorage
 */
export async function GET(_request: NextRequest) {
    return NextResponse.json({});
}

/**
 * POST /api/preferences
 * No-op - settings now stored in localStorage
 */
export async function POST(_request: NextRequest) {
    return NextResponse.json({ success: true });
}
