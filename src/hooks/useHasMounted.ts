import { useSyncExternalStore } from 'react';

/**
 * Hook to detect if component has mounted on client-side
 * 
 * Prevents SSR hydration mismatches by ensuring client-only code
 * runs only after the component has mounted in the browser.
 * 
 * Uses useSyncExternalStore for optimal performance and React 18+ compatibility.
 * 
 * @returns {boolean} True if component is mounted on client, false during SSR/initial render
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasMounted = useHasMounted();
 *   
 *   if (!hasMounted) {
 *     return <Skeleton />; // Show loading state during SSR
 *   }
 *   
 *   return <ClientOnlyContent />;
 * }
 * ```
 */

// Empty subscribe function - mounting state never changes after hydration
const emptySubscribe = () => () => { };

// Returns true on client, used as snapshot
const getSnapshot = () => true;

// Returns false on server, used as server snapshot
const getServerSnapshot = () => false;

export function useHasMounted(): boolean {
    return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

