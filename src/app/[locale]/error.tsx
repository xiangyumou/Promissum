'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    const t = useTranslations('Error');

    useEffect(() => {
        // Log error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 max-w-md mx-auto p-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 text-destructive"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                        {t('title')}
                    </h2>
                    <p className="text-muted-foreground">
                        {t('description')}
                    </p>
                </div>

                {error.digest && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted/30 px-3 py-2 rounded-lg">
                        Error ID: {error.digest}
                    </p>
                )}

                <button
                    onClick={reset}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    {t('retry')}
                </button>
            </div>
        </div>
    );
}
