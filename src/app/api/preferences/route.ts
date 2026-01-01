/**
 * API Route: /api/preferences
 * 
 * Manages user preferences synchronization across devices.
 * Stores settings in database.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { z } from 'zod';

// Validation schema matching SettingsStore
const PreferencesSchema = z.object({
    deviceId: z.string(),
    defaultDurationMinutes: z.number().min(1).optional(),
    privacyMode: z.boolean().optional(),
    themeConfig: z.string().optional(), // JSON string
    dateTimeFormat: z.string().optional(),
    compactMode: z.boolean().optional(),
    sidebarOpen: z.boolean().optional(),
    confirmDelete: z.boolean().optional(),
    confirmExtend: z.boolean().optional(),
    autoRefreshInterval: z.number().min(0).optional(),
    cacheTTLMinutes: z.number().min(1).optional(),
    autoPrivacyDelayMinutes: z.number().min(0).optional(),
    apiToken: z.string().optional(),
    apiUrl: z.string().optional(),
});

/**
 * GET /api/preferences?deviceId=xxx
 * Fetch preferences for a device
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
        }

        // Find or create device
        let device = await prisma.device.findUnique({
            where: { fingerprint: deviceId },
            include: { preferences: true },
        });

        if (!device) {
            // Create new device with default preferences
            device = await prisma.device.create({
                data: {
                    fingerprint: deviceId,
                    name: null, // Will be updated with actual device name later
                    preferences: {
                        create: {}, // Uses default values from schema
                    },
                },
                include: { preferences: true },
            });
        }

        return NextResponse.json(device.preferences);
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
export async function POST(request: NextRequest) {
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
        let device = await prisma.device.findUnique({
            where: { fingerprint: deviceId },
        });

        if (!device) {
            device = await prisma.device.create({
                data: { fingerprint: deviceId },
            });
        }

        // Upsert preferences
        const preferences = await prisma.userPreferences.upsert({
            where: { deviceId: device.id },
            create: {
                deviceId: device.id,
                ...preferencesData,
            },
            update: preferencesData,
        });

        return NextResponse.json(preferences);
    } catch (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
        );
    }
}
