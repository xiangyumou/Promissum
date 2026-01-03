'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ReactNode, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import SecurityProvider from './SecurityProvider';
import ThemeRegistry from './ThemeRegistry';
import { initializeQueryPersistence } from '@/lib/cache-config';

function ToasterProvider() {
    const { theme } = useTheme();

    return (
        <Toaster
            position="top-center"
            richColors
            closeButton
            duration={3000}
            theme={theme as 'light' | 'dark' | 'system' | undefined}
        />
    );
}

/**
 * Initialize cache persistence once on client mount
 */
function CachePersistenceInitializer() {
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current) {
            initializeQueryPersistence(queryClient);
            initializedRef.current = true;
        }
    }, []);

    return null;
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <CachePersistenceInitializer />
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <ThemeRegistry />
                <SecurityProvider />
                {children}
                <ToasterProvider />
            </ThemeProvider>
            {/* DevTools only in development */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
}
