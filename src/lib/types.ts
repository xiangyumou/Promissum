/**
 * Type definitions for Chaster application
 * Shared types used across components
 */

/**
 * Item list view - used in sidebar
 */
export interface ItemListView {
    id: string;
    type: 'text' | 'image';
    original_name: string | null;
    decrypt_at: number;
    created_at: number;
    layer_count: number;
    user_id: string;
}

/**
 * Full item detail view - used in content view
 */
export interface ItemDetail extends ItemListView {
    unlocked: boolean;
    content: string | null;
}
