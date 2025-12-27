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
