import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Item represents a time-locked encrypted item
// This is the core and only table needed for the application
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

// Export types
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
