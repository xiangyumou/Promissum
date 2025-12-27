'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { ReactNode } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import SecurityProvider from './SecurityProvider';
import ThemeRegistry from './ThemeRegistry';

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

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
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
