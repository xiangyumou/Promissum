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
    // Utilities
    detectContentType,
    getContentTypeIcon,
} from './validation';
