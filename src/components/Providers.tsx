'use client';

import { Toaster } from 'sonner';
import { ReactNode } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <ToasterProvider />
        </ThemeProvider>
    );
}
