/**
 * useMediaQuery Hook
 *
 * React hook for tracking media query matches.
 * Uses useSyncExternalStore for React 18+ compatibility.
 */

import { useSyncExternalStore, useCallback } from 'react';

export function useMediaQuery(query: string, defaultValue = false): boolean {
    const subscribe = useCallback(
        (callback: () => void) => {
            const mediaQuery = typeof window !== 'undefined' ? window.matchMedia(query) : null;
            if (!mediaQuery) return () => { };

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', callback);
                return () => mediaQuery.removeEventListener('change', callback);
            }
            // Legacy support
            else {
                mediaQuery.addListener(callback);
                return () => mediaQuery.removeListener(callback);
            }
        },
        [query]
    );

    const getSnapshot = useCallback(() => {
        const mediaQuery = typeof window !== 'undefined' ? window.matchMedia(query) : null;
        return mediaQuery?.matches ?? defaultValue;
    }, [query, defaultValue]);

    const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

