/**
 * useMediaQuery Hook
 *
 * React hook for tracking media query matches.
 * Uses browserService for testability.
 */

import { useState, useEffect } from 'react';
import { browserService } from '@/lib/services/browser-service';

export function useMediaQuery(query: string, defaultValue = false): boolean {
    const [matches, setMatches] = useState(defaultValue);

    useEffect(() => {
        const mediaQuery = browserService.matchMedia(query);
        if (!mediaQuery) return;

        setMatches(mediaQuery.matches);

        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
        // Legacy support
        else {
            mediaQuery.addListener(listener);
            return () => mediaQuery.removeListener(listener);
        }
    }, [query]);

    return matches;
}
