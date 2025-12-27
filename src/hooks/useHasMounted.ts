import { useEffect, useState } from 'react';

/**
 * Hook to detect if component has mounted on client-side
 * 
 * Prevents SSR hydration mismatches by ensuring client-only code
 * runs only after the component has mounted in the browser.
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
export function useHasMounted(): boolean {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return hasMounted;
}
