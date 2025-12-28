/**
 * Fuzzy Search Utility
 * 
 * Provides fuzzy search functionality using Fuse.js library
 * for searching across item metadata (title, tags, content preview)
 */

import Fuse, { IFuseOptions } from 'fuse.js';
import { ApiItemListView } from '../types';

/**
 * Fuse.js configuration for item search
 */
const FUSE_OPTIONS: IFuseOptions<ApiItemListView> = {
    keys: [
        { name: 'metadata.title', weight: 2 },      // Higher weight for titles
        { name: 'metadata.tags', weight: 1.5 },     // Tags also important
        { name: 'type', weight: 0.5 },              // Lower weight for type
    ],
    threshold: 0.4,  // 0.0 = perfect match, 1.0 = match anything
    distance: 100,   // Maximum distance in characters for a match
    minMatchCharLength: 2, // Minimum characters to match
    includeScore: true,
    useExtendedSearch: false,
    ignoreLocation: true, // Search entire string, not just beginning
};

/**
 * Perform fuzzy search on items
 * @param items Items to search through
 * @param query Search query string
 * @returns Filtered items sorted by relevance
 */
export function fuzzySearchItems(
    items: ApiItemListView[],
    query: string
): ApiItemListView[] {
    // If no query, return all items
    if (!query || query.trim() === '') {
        return items;
    }

    const fuse = new Fuse(items, FUSE_OPTIONS);
    const results = fuse.search(query.trim());

    // Return items from search results
    return results.map(result => result.item);
}

/**
 * Check if an item matches a search query (for real-time filtering)
 * @param item Item to check
 * @param query Search query
 * @returns True if item matches query
 */
export function itemMatchesQuery(
    item: ApiItemListView,
    query: string
): boolean {
    if (!query || query.trim() === '') {
        return true;
    }

    const lowerQuery = query.toLowerCase().trim();

    // Check title
    if (item.metadata?.title?.toLowerCase().includes(lowerQuery)) {
        return true;
    }

    // Check tags
    if (item.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        return true;
    }

    // Check type
    if (item.type.toLowerCase().includes(lowerQuery)) {
        return true;
    }

    return false;
}
