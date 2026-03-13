import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { toSnakeCase } from '@/lib/utils';
import { withApiHandler } from '@/lib/api-utils';

async function getHandler() {
    const now = new Date();

    // Get total count
    const totalResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items);
    const totalItems = totalResult[0]?.count || 0;

    // Get locked items (decryptAt > now)
    const lockedResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.decryptAt} > ${now}`);
    const lockedItems = lockedResult[0]?.count || 0;

    // Get counts by type
    const textResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.type} = 'text'`);
    const textCount = textResult[0]?.count || 0;

    const imageResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.type} = 'image'`);
    const imageCount = imageResult[0]?.count || 0;

    const unlockedItems = totalItems - lockedItems;

    return NextResponse.json(toSnakeCase({
        totalItems,
        lockedItems,
        unlockedItems,
        byType: {
            text: textCount,
            image: imageCount,
        },
    }));
}

export const GET = () => withApiHandler(getHandler);
