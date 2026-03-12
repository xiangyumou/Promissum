/**
 * API Route: /api/preferences
 *
 * Manages user preferences synchronization across devices.
 * Stores settings in database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { devices, userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema matching SettingsStore
const PreferencesSchema = z.object({
    deviceId: z.string(),
    defaultDurationMinutes: z.number().min(1).optional(),
    themeConfig: z.string().optional(), // JSON string
    dateTimeFormat: z.string().optional(),
    sidebarOpen: z.boolean().optional(),
    confirmDelete: z.boolean().optional(),
    confirmExtend: z.boolean().optional(),
    autoRefreshInterval: z.number().min(0).optional(),
    cacheTTLMinutes: z.number().min(1).optional(),
});

/**
 * GET /api/preferences?deviceId=xxx
 * Fetch preferences for a device
 */
async function getHandler(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
        }

        // Find device by fingerprint
        const device = await db.select().from(devices).where(eq(devices.fingerprint, deviceId)).limit(1);

        const deviceRecord = device[0];

        if (!deviceRecord) {
            // Create new device with default preferences
            const newDeviceId = crypto.randomUUID();
            await db.insert(devices).values({
                id: newDeviceId,
                fingerprint: deviceId,
                name: null,
            });
            await db.insert(userPreferences).values({
                deviceId: newDeviceId,
            });

            const newPrefs = await db.select().from(userPreferences).where(eq(userPreferences.deviceId, newDeviceId)).limit(1);
            return NextResponse.json(newPrefs[0] || {});
        }

        // Get preferences for device
        const prefs = await db.select().from(userPreferences).where(eq(userPreferences.deviceId, deviceRecord.id)).limit(1);
        return NextResponse.json(prefs[0] || {});
    } catch (error) {
        console.error('Error fetching preferences:', error);
        return NextResponse.json(
            { error: 'Failed to fetch preferences' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/preferences
 * Update preferences for a device
 */
async function postHandler(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = PreferencesSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid preferences data',
                details: validation.error.issues
            }, { status: 400 });
        }

        const { deviceId, ...preferencesData } = validation.data;

        // Find or create device
        const device = await db.select().from(devices).where(eq(devices.fingerprint, deviceId)).limit(1);
        const deviceRecord = device[0];

        if (!deviceRecord) {
            const newDeviceId = crypto.randomUUID();
            await db.insert(devices).values({
                id: newDeviceId,
                fingerprint: deviceId,
            });
            deviceRecord = { id: newDeviceId } as typeof deviceRecord;
        }

        // Upsert preferences
        const existing = await db.select().from(userPreferences).where(eq(userPreferences.deviceId, deviceRecord.id)).limit(1);

        if (existing[0]) {
            await db.update(userPreferences)
                .set({ ...preferencesData, updatedAt: new Date() })
                .where(eq(userPreferences.deviceId, deviceRecord.id));
        } else {
            await db.insert(userPreferences).values({
                deviceId: deviceRecord.id,
                ...preferencesData,
            });
        }

        const preferences = await db.select().from(userPreferences).where(eq(userPreferences.deviceId, deviceRecord.id)).limit(1);

        return NextResponse.json(preferences[0] || {});
    } catch (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
        );
    }
}

// Export handlers without rate limiting
export const GET = getHandler;
export const POST = postHandler;
