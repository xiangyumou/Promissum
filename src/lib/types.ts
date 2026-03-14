/**
 * Type definitions for Promissum application
 * Re-export from validation.ts for single source of truth
 */

export {
    // Schemas
    BundleFileSchema,
    ContentBundleSchema,
    ItemMetadataSchema,
    FilterParamsSchema,
    QuerySchema,
    CreateItemSchema,
    ItemIdSchema,
    ItemSchema,
    SystemStatsSchema,
    // Types
    type BundleFile,
    type ContentBundle,
    type ItemMetadata,
    type FilterParams,
    type QueryInput,
    type CreateItemInput,
    type Item,
    type SystemStats,
    type ContentType,
} from './validation';

import type { ContentBundle, ContentType } from './validation';

/**
 * Detect content type from bundle
 */
export function detectContentType(bundle: ContentBundle): ContentType {
    const hasText = !!bundle.text?.trim();
    const fileCount = bundle.files?.length || 0;

    if (hasText && fileCount > 0) return 'mixed';
    if (hasText) return 'text';
    if (fileCount === 0) return 'text'; // Fixed: empty defaults to text
    if (fileCount === 1) {
        const file = bundle.files[0];
        if (file.mimeType.startsWith('image/')) return 'image';
        if (file.mimeType.startsWith('video/')) return 'video';
        if (file.mimeType.startsWith('audio/')) return 'audio';
        if (file.mimeType === 'application/pdf') return 'pdf';
        if (['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(file.mimeType)) {
            return 'archive';
        }
    }
    return 'file';
}

/**
 * Get icon name for content type
 */
export function getContentTypeIcon(type: ContentType): string {
    const icons: Record<ContentType, string> = {
        text: 'FileText',
        image: 'Image',
        file: 'File',
        mixed: 'Layers',
    };
    return icons[type] || 'File';
}
