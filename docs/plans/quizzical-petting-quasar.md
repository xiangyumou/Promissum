# 数据库迁移：PostgreSQL → SQLite + Prisma → Drizzle + 移除 Redis

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将数据库从 PostgreSQL 迁移到 SQLite，ORM 从 Prisma 迁移到 Drizzle，并完全移除 Redis 和 rate limiting 功能。

**架构:** 使用 Drizzle ORM 配合 SQLite 本地文件数据库，简化部署架构。移除所有 rate limiting 相关代码，简化 API 路由。

**Tech Stack:** Drizzle ORM, SQLite (better-sqlite3), 移除 ioredis

---

## 文件结构变更

| 操作 | 路径 | 说明 |
|------|------|------|
| 删除 | `prisma/` | 整个 Prisma 配置目录 |
| 创建 | `src/lib/db/schema.ts` | Drizzle schema 定义 |
| 创建 | `src/lib/db/drizzle.ts` | Drizzle 客户端单例 |
| 创建 | `drizzle.config.ts` | Drizzle 配置 |
| 修改 | `src/lib/db/client.ts` | 改为导出 Drizzle 客户端 |
| 删除 | `src/lib/services/rate-limiting/` | 整个 rate limiting 目录 |
| 修改 | `src/app/api/*/route.ts` | 移除 withRateLimit 包装器 |
| 修改 | `package.json` | 更新依赖 |
| 修改 | `docker-compose.yml` | 移除 PostgreSQL 和 Redis 服务 |
| 修改 | `.env.example` | 更新环境变量模板 |

---

## Chunk 1: 安装依赖和配置 Drizzle

### Task 1.1: 安装 Drizzle 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 Drizzle 相关依赖**

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

- [ ] **Step 2: 验证安装成功**

```bash
npm ls drizzle-orm better-sqlite3
```
Expected: 包已安装，无错误

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add drizzle-orm and better-sqlite3 for SQLite support"
```

---

### Task 1.2: 创建 Drizzle 配置文件

**Files:**
- Create: `drizzle.config.ts`

- [ ] **Step 1: 创建 Drizzle 配置文件**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DATABASE_URL || './promissum.db',
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add drizzle.config.ts
git commit -m "config: add drizzle configuration for SQLite"
```

---

### Task 1.3: 创建 Drizzle Schema

**Files:**
- Create: `src/lib/db/schema.ts`

- [ ] **Step 1: 创建 Drizzle schema 文件**

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Device represents a unique browser/client
export const devices = sqliteTable('devices', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    fingerprint: text('fingerprint').notNull().unique(),
    name: text('name'),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// UserPreferences stores all settings from SettingsStore
export const userPreferences = sqliteTable('user_preferences', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: text('device_id').notNull().unique().references(() => devices.id, { onDelete: 'cascade' }),

    // Default Behavior
    defaultDurationMinutes: integer('default_duration_minutes').notNull().default(60),
    privacyMode: integer('privacy_mode', { mode: 'boolean' }).notNull().default(false),
    panicUrl: text('panic_url').notNull().default('https://google.com'),

    // Theme Configuration (JSON string of CSS variables)
    themeConfig: text('theme_config').notNull().default('{}'),

    // Interface
    dateTimeFormat: text('date_time_format').notNull().default('yyyy-MM-dd HH:mm'),
    compactMode: integer('compact_mode', { mode: 'boolean' }).notNull().default(false),
    sidebarOpen: integer('sidebar_open', { mode: 'boolean' }).notNull().default(true),

    // Behavior
    confirmDelete: integer('confirm_delete', { mode: 'boolean' }).notNull().default(true),
    confirmExtend: integer('confirm_extend', { mode: 'boolean' }).notNull().default(true),
    autoRefreshInterval: integer('auto_refresh_interval').notNull().default(60), // seconds

    // Caching
    cacheTTLMinutes: integer('cache_ttl_minutes').notNull().default(5),

    // Security
    autoPrivacyDelayMinutes: integer('auto_privacy_delay_minutes').notNull().default(5),
    panicShortcut: text('panic_shortcut').notNull().default('alt+p'),
    apiToken: text('api_token').notNull().default(''),
    apiUrl: text('api_url').notNull().default(''),

    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ActiveSession tracks which devices are currently viewing which items
export const activeSessions = sqliteTable('active_sessions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(), // Item being viewed
    startedAt: integer('started_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    lastActive: integer('last_active', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Item represents a time-locked encrypted item
export const items = sqliteTable('items', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: text('type').notNull(), // 'text' | 'image'
    encryptedData: text('encrypted_data').notNull(),
    originalName: text('original_name'),
    decryptAt: integer('decrypt_at', { mode: 'timestamp' }).notNull(),
    roundNumber: integer('round_number').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    layerCount: integer('layer_count').notNull().default(1),
    metadata: text('metadata'), // JSON string
});

// SystemConfig stores key-value configuration
export const systemConfig = sqliteTable('system_config', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

// ApiLog tracks API requests (optional)
export const apiLogs = sqliteTable('api_logs', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    token: text('token'),
    endpoint: text('endpoint').notNull(),
    method: text('method').notNull(),
    statusCode: integer('status_code').notNull(),
    timestamp: integer('timestamp').notNull(),
    duration: integer('duration'),
});

// Export types
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type NewActiveSession = typeof activeSessions.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type SystemConfigEntry = typeof systemConfig.$inferSelect;
export type NewSystemConfigEntry = typeof systemConfig.$inferInsert;
export type ApiLog = typeof apiLogs.$inferSelect;
export type NewApiLog = typeof apiLogs.$inferInsert;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "db: add drizzle schema for SQLite"
```

---

### Task 1.4: 创建 Drizzle 客户端

**Files:**
- Create: `src/lib/db/drizzle.ts`
- Modify: `src/lib/db/client.ts`

- [ ] **Step 1: 创建 Drizzle 客户端文件**

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const globalForDb = global as unknown as { db: ReturnType<typeof drizzle> | undefined };

function createDb() {
    const dbPath = process.env.DATABASE_URL || './promissum.db';
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency
    return drizzle(sqlite, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db;
}
```

- [ ] **Step 2: 修改 client.ts 导出 Drizzle 客户端**

```typescript
// Re-export from drizzle.ts for backward compatibility during migration
export { db, db as prisma } from './drizzle';
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/drizzle.ts src/lib/db/client.ts
git commit -m "db: add drizzle client singleton"
```

---

## Chunk 2: 迁移 Repository 层

### Task 2.1: 重写 Item Repository

**Files:**
- Modify: `src/lib/services/items/item-repository.ts`

- [ ] **Step 1: 重写 item-repository.ts 使用 Drizzle**

```typescript
import { db } from '@/lib/db/client';
import { items, type NewItem } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, like, or } from 'drizzle-orm';

export interface CreateItemData {
    id: string;
    type: string;
    encryptedData: string;
    originalName: string | null;
    decryptAt: Date;
    roundNumber: bigint;
    layerCount: number;
    metadata: Record<string, unknown>;
}

export async function createItemInDb(data: CreateItemData) {
    const newItem: NewItem = {
        id: data.id,
        type: data.type,
        encryptedData: data.encryptedData,
        originalName: data.originalName,
        decryptAt: data.decryptAt,
        roundNumber: Number(data.roundNumber),
        layerCount: data.layerCount,
        metadata: JSON.stringify(data.metadata),
    };

    await db.insert(items).values(newItem);
    return newItem;
}

export interface FindItemsParams {
    where: {
        type?: string;
        decryptAt?: { gte?: Date; lte?: Date };
        OR?: Array<{ type?: string; decryptAt?: { gte?: Date } }>;
    };
    orderBy: { decryptAt?: 'asc' | 'desc'; createdAt?: 'asc' | 'desc' };
    take: number;
    skip: number;
}

export async function findItemsInDb(params: FindItemsParams) {
    let query = db.select().from(items);

    // Build where conditions
    const conditions = [];
    if (params.where.type) {
        conditions.push(eq(items.type, params.where.type));
    }
    if (params.where.decryptAt?.gte) {
        conditions.push(sql`${items.decryptAt} >= ${params.where.decryptAt.gte}`);
    }
    if (params.where.decryptAt?.lte) {
        conditions.push(sql`${items.decryptAt} <= ${params.where.decryptAt.lte}`);
    }

    if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
    }

    // Build order by
    let orderByClause;
    if (params.orderBy.decryptAt) {
        orderByClause = params.orderBy.decryptAt === 'asc' ? asc(items.decryptAt) : desc(items.decryptAt);
    } else if (params.orderBy.createdAt) {
        orderByClause = params.orderBy.createdAt === 'asc' ? asc(items.createdAt) : desc(items.createdAt);
    }

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(items);
    const total = countResult[0]?.count || 0;

    // Get paginated results
    const results = await query
        .orderBy(orderByClause || desc(items.createdAt))
        .limit(params.take)
        .offset(params.skip);

    return [results, total] as const;
}

export async function findItemHeaderById(id: string) {
    const result = await db.select({
        id: items.id,
        type: items.type,
        originalName: items.originalName,
        decryptAt: items.decryptAt,
        createdAt: items.createdAt,
        layerCount: items.layerCount,
        metadata: items.metadata,
    }).from(items).where(eq(items.id, id)).limit(1);

    return result[0] || null;
}

export async function findItemEncryptedData(id: string) {
    const result = await db.select({
        encryptedData: items.encryptedData,
    }).from(items).where(eq(items.id, id)).limit(1);

    return result[0] || null;
}

export async function findItemForExtension(id: string) {
    const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return result[0] || null;
}

export interface UpdateItemExtensionParams {
    id: string;
    currentLayerCount: number;
    encryptedData: string;
    decryptAt: Date;
    roundNumber: bigint;
}

export async function updateItemExtension(params: UpdateItemExtensionParams) {
    const result = await db.update(items)
        .set({
            encryptedData: params.encryptedData,
            decryptAt: params.decryptAt,
            roundNumber: Number(params.roundNumber),
            layerCount: params.currentLayerCount + 1,
        })
        .where(and(
            eq(items.id, params.id),
            eq(items.layerCount, params.currentLayerCount)
        ));

    if (result.changes === 0) {
        throw new Error('Item was modified during operation, please retry');
    }

    return result;
}

export async function deleteItemFromDb(id: string) {
    const result = await db.delete(items).where(eq(items.id, id));

    if (result.changes === 0) {
        throw new Error('Item not found');
    }

    return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/items/item-repository.ts
git commit -m "refactor: migrate item repository from Prisma to Drizzle"
```

---

### Task 2.2: 更新 Preferences API 使用 Drizzle

**Files:**
- Modify: `src/app/api/preferences/route.ts`

- [ ] **Step 1: 重写 preferences API 使用 Drizzle**

```typescript
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

        // Find or create device
        let device = await db.query.devices.findFirst({
            where: eq(devices.fingerprint, deviceId),
            with: { preferences: true },
        });

        if (!device) {
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

            device = await db.query.devices.findFirst({
                where: eq(devices.id, newDeviceId),
                with: { preferences: true },
            });
        }

        return NextResponse.json(device?.preferences || {});
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
        let device = await db.query.devices.findFirst({
            where: eq(devices.fingerprint, deviceId),
        });

        if (!device) {
            const newDeviceId = crypto.randomUUID();
            await db.insert(devices).values({
                id: newDeviceId,
                fingerprint: deviceId,
            });
            device = { id: newDeviceId };
        }

        // Upsert preferences
        const existing = await db.query.userPreferences.findFirst({
            where: eq(userPreferences.deviceId, device.id),
        });

        if (existing) {
            await db.update(userPreferences)
                .set({ ...preferencesData, updatedAt: new Date() })
                .where(eq(userPreferences.deviceId, device.id));
        } else {
            await db.insert(userPreferences).values({
                deviceId: device.id,
                ...preferencesData,
            });
        }

        const preferences = await db.query.userPreferences.findFirst({
            where: eq(userPreferences.deviceId, device.id),
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

// Export handlers without rate limiting
export const GET = getHandler;
export const POST = postHandler;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/preferences/route.ts
git commit -m "refactor: migrate preferences API from Prisma to Drizzle"
```

---

## Chunk 3: 移除 Rate Limiting

### Task 3.1: 删除 Rate Limiting 目录

**Files:**
- Delete: `src/lib/services/rate-limiting/`

- [ ] **Step 1: 删除 rate-limiting 目录**

```bash
rm -rf src/lib/services/rate-limiting
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove rate limiting service and Redis dependency"
```

---

### Task 3.2: 更新 API 路由移除 Rate Limiting

**Files:**
- Modify: `src/app/api/items/route.ts`
- Modify: `src/app/api/items/[id]/route.ts`
- Modify: `src/app/api/items/[id]/extend/route.ts`
- Modify: `src/app/api/stats/route.ts`

- [ ] **Step 1: 更新 items/route.ts**

移除 `withRateLimit` import 和包装器：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createItem, getItems } from '@/lib/services/items/item-service';
import { toSnakeCase } from '@/lib/utils';
import { DEFAULT_LOCK_DURATION_MINUTES } from '@/lib/constants';
import { apiQuerySchema, createItemSchema } from '@/lib/services/items/item-validation';
import { withApiHandler, successResponse, validateSearchParams } from '@/lib/api-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

async function getHandler(request: NextRequest) {
    const query = validateSearchParams(request.url, apiQuerySchema);

    const result = await getItems({
        status: (query.status || undefined),
        type: (query.type || undefined),
        search: (query.search || undefined),
        sort: query.sort,
        limit: query.limit,
        offset: query.offset,
    });

    const mappedItems = result.items.map(item => toSnakeCase({
        id: item.id,
        type: item.type,
        decryptAt: item.decryptAt,
        createdAt: item.createdAt,
        unlocked: item.unlocked,
        metadata: item.metadata,
    }));

    return NextResponse.json({
        items: mappedItems,
        lastDuration: DEFAULT_LOCK_DURATION_MINUTES,
        total: result.total
    });
}

async function postHandler(request: NextRequest) {
    const formData = await request.formData();
    const rawData: Record<string, unknown> = {};

    const type = formData.get('type');
    if (type) rawData.type = type;

    const durationStr = formData.get('durationMinutes');
    if (durationStr) rawData.durationMinutes = Number(durationStr);

    const decryptAtStr = formData.get('decryptAt');
    if (decryptAtStr) rawData.decryptAt = Number(decryptAtStr);

    const metadataString = formData.get('metadata') as string;
    if (metadataString) {
        try {
            rawData.metadata = JSON.parse(metadataString);
        } catch {
            throw new Error('Invalid metadata JSON');
        }
    }

    if (type === 'text') {
        const text = formData.get('content');
        if (typeof text === 'string') {
            if (text.length > MAX_FILE_SIZE) {
                throw new Error('Text content too large');
            }
            rawData.content = text;
        }
    } else if (type === 'image') {
        const file = formData.get('file');
        if (file instanceof File) {
             if (file.size > MAX_FILE_SIZE) {
                throw new Error('File too large (max 10MB)');
            }
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP');
            }
            const arrayBuffer = await file.arrayBuffer();
            rawData.content = Buffer.from(arrayBuffer).toString('base64');
        }
    }

    const validatedInput = createItemSchema.parse(rawData);
    const item = await createItem(validatedInput);

    return successResponse({
        item: {
            id: item.id,
            type: item.type,
            decryptAt: item.decryptAt,
            unlocked: item.unlocked,
            metadata: item.metadata,
        },
        success: true
    }, 201);
}

// Export without rate limiting
export const GET = (req: NextRequest) => withApiHandler(() => getHandler(req));
export const POST = (req: NextRequest) => withApiHandler(() => postHandler(req));
```

- [ ] **Step 2: 更新 items/[id]/route.ts**

```typescript
import { NextRequest } from 'next/server';
import { getItemById, deleteItem } from '@/lib/services/items/item-service';
import { withApiHandler, successResponse } from '@/lib/api-utils';

async function getHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

    const item = await getItemById(id);

    return successResponse({
        id: item.id,
        type: item.type,
        decryptAt: item.decryptAt,
        createdAt: item.createdAt,
        unlocked: item.unlocked,
        content: item.content,
        metadata: item.metadata,
        timeRemainingMs: item.timeRemainingMs,
        layerCount: item.layerCount,
        originalName: item.originalName,
    });
}

async function deleteHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

    await deleteItem(id);

    return successResponse({ success: true });
}

// Export without rate limiting
export const GET = (req: NextRequest, ctx: unknown) => withApiHandler(() => getHandler(req, ctx));
export const DELETE = (req: NextRequest, ctx: unknown) => withApiHandler(() => deleteHandler(req, ctx));
```

- [ ] **Step 3: 更新 items/[id]/extend/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extendItem } from '@/lib/services/items/item-service';
import { formatZodErrors, ExtendItemSchema } from '@/lib/validation';
import { toSnakeCase } from '@/lib/utils';

async function postHandler(request: NextRequest, context?: unknown) {
    try {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;

        const body = await request.json();

        const validation = ExtendItemSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: formatZodErrors(validation.error)
            }, { status: 400 });
        }

        const { minutes } = validation.data;

        const result = await extendItem(id, minutes);

        return NextResponse.json(toSnakeCase({
            success: true,
            decryptAt: result.decryptAt,
            layerCount: result.layerCount,
        }));
    } catch (error) {
        console.error('Error extending lock:', error);
        const message = error instanceof Error ? error.message : 'Failed to extend lock';

        if (message === 'Item not found') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (message.includes('retry')) {
            return NextResponse.json({
                error: 'Concurrent modification detected. Please refresh and try again.'
            }, { status: 409 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Export without rate limiting
export const POST = postHandler;
```

- [ ] **Step 4: 更新 stats/route.ts**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/
git commit -m "refactor: remove rate limiting from all API routes"
```

---

## Chunk 4: 更新配置和依赖

### Task 4.1: 更新环境变量配置

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: 更新 .env.example**

```bash
# =============================================================================
# Promissum Environment Configuration Template
# =============================================================================
# Copy this file to .env for local development
# DO NOT commit actual .env files to version control
# =============================================================================

# -----------------------------------------------------------------------------
# Application (Next.js)
# -----------------------------------------------------------------------------

# Node environment (development | production)
NODE_ENV=development

# Port for the Next.js server (default: 3000)
PORT=3000

# -----------------------------------------------------------------------------
# Database Configuration (SQLite)
# -----------------------------------------------------------------------------

# SQLite database file path
# For local development: relative path to database file
DATABASE_URL=./promissum.db

# -----------------------------------------------------------------------------
# Encryption Configuration (Drand)
# -----------------------------------------------------------------------------

# Mock drand (distributed randomness beacon) for development
# Set to "false" in production to use real drand network
MOCK_DRAND=true

# Drand chain URL (only used if MOCK_DRAND=false)
DRAND_CHAIN_URL=https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971

# -----------------------------------------------------------------------------
# Public Variables (Client-side accessible)
# Note: These must start with NEXT_PUBLIC_ to be exposed to the browser
# -----------------------------------------------------------------------------

# Public URL of this application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Date format for display (e.g. yyyy-MM-dd HH:mm)
NEXT_PUBLIC_DATE_FORMAT=yyyy-MM-dd HH:mm

# Auto-refresh interval in seconds
NEXT_PUBLIC_AUTO_REFRESH_INTERVAL=60

# Cache TTL in minutes
NEXT_PUBLIC_CACHE_TTL=5

# Application port (exposed on host)
APP_PORT=3000
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "config: update environment template for SQLite"
```

---

### Task 4.2: 更新 Docker Compose

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: 简化 docker-compose.yml**

```yaml
# =============================================================================
# Production Docker Compose Configuration
# =============================================================================
# This file defines the production-ready deployment of Promissum
# For local development: npm run dev
# =============================================================================

services:
  # -------------------------------------------------------------------------
  # Promissum Application
  # -------------------------------------------------------------------------
  app:
    image: ghcr.io/xiangyumou/promissum:latest
    build: .
    container_name: promissum-app
    ports:
      - "${APP_PORT:-3000}:3000"
    restart: unless-stopped
    environment:
      # Application
      NODE_ENV: production
      PORT: 3000

      # Database (SQLite - local file in container)
      DATABASE_URL: /data/promissum.db

      # Encryption (Drand)
      MOCK_DRAND: "${MOCK_DRAND:-false}"
      DRAND_CHAIN_URL: ${DRAND_CHAIN_URL:-https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971}

      # Public variables
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
      NEXT_PUBLIC_DATE_FORMAT: ${NEXT_PUBLIC_DATE_FORMAT:-yyyy-MM-dd HH:mm}
      NEXT_PUBLIC_AUTO_REFRESH_INTERVAL: ${NEXT_PUBLIC_AUTO_REFRESH_INTERVAL:-60}
      NEXT_PUBLIC_CACHE_TTL: ${NEXT_PUBLIC_CACHE_TTL:-5}
    volumes:
      - promissum_data:/data
    networks:
      - promissum-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3

# -----------------------------------------------------------------------------
# Networks
# -----------------------------------------------------------------------------
networks:
  promissum-network:
    driver: bridge
    name: promissum-network

# -----------------------------------------------------------------------------
# Volumes
# -----------------------------------------------------------------------------
volumes:
  promissum_data:
    name: promissum_data
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "config: simplify docker-compose for SQLite (remove PostgreSQL/Redis)"
```

---

### Task 4.3: 更新 package.json 移除 Prisma 和 Redis

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 卸载 Prisma 和 Redis 依赖**

```bash
npm uninstall @prisma/client ioredis
npm uninstall -D prisma @types/ioredis
```

- [ ] **Step 2: 添加 drizzle-kit 脚本到 package.json**

添加以下 scripts：
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: remove Prisma and Redis dependencies"
```

---

## Chunk 5: 删除 Prisma 和更新 Stats Service

### Task 5.1: 删除 Prisma 目录

**Files:**
- Delete: `prisma/`

- [ ] **Step 1: 删除 Prisma 目录**

```bash
rm -rf prisma/
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove Prisma schema and migrations"
```

---

### Task 5.2: 更新 Stats Service

**Files:**
- Modify: `src/lib/services/stats/stats-service.ts`

- [ ] **Step 1: 读取当前 stats-service.ts 内容**

先读取文件，然后用 Drizzle 重写。

- [ ] **Step 2: 更新 stats service 使用 Drizzle**

```typescript
import { db } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export interface SystemStats {
    totalItems: number;
    lockedItems: number;
    unlockedItems: number;
    textItems: number;
    imageItems: number;
}

export async function getSystemStats(): Promise<SystemStats> {
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

    // Get unlocked items (decryptAt <= now)
    const unlockedResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.decryptAt} <= ${now}`);
    const unlockedItems = unlockedResult[0]?.count || 0;

    // Get text items count
    const textResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.type} = 'text'`);
    const textItems = textResult[0]?.count || 0;

    // Get image items count
    const imageResult = await db.select({
        count: sql<number>`count(*)`,
    }).from(items).where(sql`${items.type} = 'image'`);
    const imageItems = imageResult[0]?.count || 0;

    return {
        totalItems,
        lockedItems,
        unlockedItems,
        textItems,
        imageItems,
    };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/stats/
git commit -m "refactor: migrate stats service from Prisma to Drizzle"
```

---

### Task 5.3: 删除 Rate Limiting 测试文件

**Files:**
- Delete: `src/test/unit/lib/services/rate-limiting/ratelimit.test.ts`

- [ ] **Step 1: 删除测试文件**

```bash
rm -f src/test/unit/lib/services/rate-limiting/ratelimit.test.ts
```

- [ ] **Step 2: 如果目录为空，删除目录**

```bash
rmdir -p src/test/unit/lib/services/rate-limiting 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: remove rate limiting tests"
```

---

## Chunk 6: 数据库迁移和验证

### Task 6.1: 生成 Drizzle 迁移

**Files:**
- Create: `drizzle/migrations/`

- [ ] **Step 1: 生成迁移文件**

```bash
npm run db:generate
```

- [ ] **Step 2: 验证迁移文件已创建**

```bash
ls -la drizzle/migrations/
```
Expected: 看到生成的 .sql 迁移文件

- [ ] **Step 3: Commit**

```bash
git add drizzle/migrations/
git commit -m "db: generate initial Drizzle migrations for SQLite"
```

---

### Task 6.2: 运行迁移

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 添加 SQLite 数据库文件到 .gitignore**

```bash
echo "*.db" >> .gitignore
echo "*.db-journal" >> .gitignore
```

- [ ] **Step 2: 运行迁移创建数据库**

```bash
npm run db:migrate
```

- [ ] **Step 3: 验证数据库文件已创建**

```bash
ls -la *.db
```
Expected: promissum.db 文件存在

- [ ] **Step 4: Commit .gitignore 更新**

```bash
git add .gitignore
git commit -m "chore: ignore SQLite database files"
```

---

## Chunk 7: 最终清理和验证

### Task 7.1: 运行类型检查

- [ ] **Step 1: 运行 TypeScript 类型检查**

```bash
npm run type-check
```
Expected: 无类型错误

- [ ] **Step 2: 如果有错误，修复它们**

修复任何 Drizzle 相关的类型错误。

- [ ] **Step 3: Commit 修复**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors after Drizzle migration"
```

---

### Task 7.2: 运行测试

- [ ] **Step 1: 运行测试套件**

```bash
npm test
```

- [ ] **Step 2: 修复失败的测试**

更新任何使用 Prisma 或 rate limiting 的测试。

- [ ] **Step 3: Commit 修复**

```bash
git add -A
git commit -m "test: update tests for Drizzle and remove rate limiting tests"
```

---

### Task 7.3: 运行 Lint

- [ ] **Step 1: 运行 ESLint**

```bash
npm run lint
```
Expected: 无 lint 错误

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: fix linting issues"
```

---

## 验证清单

- [ ] TypeScript 编译通过 (`npm run type-check`)
- [ ] 所有测试通过 (`npm test`)
- [ ] Lint 检查通过 (`npm run lint`)
- [ ] 应用可以启动 (`npm run dev`)
- [ ] API 路由正常工作
- [ ] 数据库操作正常工作
- [ ] SQLite 数据库文件正确创建

## 回滚计划

如果需要回滚：

1. 恢复 Prisma 相关文件从 git history
2. 重新安装 Prisma 依赖：`npm install @prisma/client ioredis` 和 `npm install -D prisma @types/ioredis`
3. 恢复 PostgreSQL 和 Redis 到 docker-compose.yml
4. 恢复 .env.example 中的数据库配置
