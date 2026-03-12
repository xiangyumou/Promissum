import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

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

// Define relations for query builder
export const devicesRelations = relations(devices, ({ one, many }) => ({
    preferences: one(userPreferences, {
        fields: [devices.id],
        references: [userPreferences.deviceId],
    }),
    sessions: many(activeSessions),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
    device: one(devices, {
        fields: [userPreferences.deviceId],
        references: [devices.id],
    }),
}));

export const activeSessionsRelations = relations(activeSessions, ({ one }) => ({
    device: one(devices, {
        fields: [activeSessions.deviceId],
        references: [devices.id],
    }),
}));

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
