'use client';

import { useApiHealth } from '@/lib/use-api-health';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function ApiStatusIndicator() {
    const { data, isError, isLoading } = useApiHealth();
    const t = useTranslations('ApiStatus');

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                <span>{t('checking')}</span>
            </div>
        );
    }

    const isConnected = !isError && data?.status === 'ok';

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                isConnected
                    ? "text-emerald-500 bg-emerald-500/10"
                    : "text-red-500 bg-red-500/10"
            )}
            title={isConnected ? t('connected') : t('disconnected')}
        >
            {isConnected ? (
                <>
                    <Wifi size={12} />
                    <span className="hidden sm:inline">{t('connected')}</span>
                </>
            ) : (
                <>
                    <WifiOff size={12} />
                    <span className="hidden sm:inline">{t('offline')}</span>
                </>
            )}
        </div>
    );
}
