'use client';

import { useMemo } from 'react';
import { ApiItemListView } from '@/lib/types';
import { Clock, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS, Locale } from 'date-fns/locale';
import { useLocale } from 'next-intl';

interface UpcomingUnlocksProps {
    items: ApiItemListView[];
    onView?: (id: string) => void;
}

export default function UpcomingUnlocks({ items, onView }: UpcomingUnlocksProps) {
    const t = useTranslations('Dashboard');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const dateLocale = useMemo(() => locale === 'zh' ? zhCN : enUS, [locale]);

    // Sort by unlock time (earliest first)
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => a.decrypt_at - b.decrypt_at);
    }, [items]);

    if (sortedItems.length === 0) {
        return (
            <div className="glass-card p-6 rounded-2xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="text-primary" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">{t('upcomingUnlocks')}</h3>
                        <p className="text-xs text-muted-foreground">{t('upcomingUnlocksDesc')}</p>
                    </div>
                </div>
                <div className="text-center py-8 text-muted-foreground text-sm">
                    {t('noUpcomingUnlocks')}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="text-primary" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('upcomingUnlocks')}</h3>
                    <p className="text-xs text-muted-foreground">{t('upcomingUnlocksDesc')}</p>
                </div>
            </div>

            <div className="space-y-2">
                {sortedItems.slice(0, 5).map((item) => (
                    <UpcomingUnlockItem
                        key={item.id}
                        item={item}
                        onView={onView}
                        locale={dateLocale}
                        t={t}
                        tCommon={tCommon}
                    />
                ))}
            </div>

            {sortedItems.length > 5 && (
                <div className="mt-3 text-center text-sm text-muted-foreground">
                    +{sortedItems.length - 5} more
                </div>
            )}
        </div>
    );
}

interface UpcomingUnlockItemProps {
    item: ApiItemListView;
    onView?: (id: string) => void;
    locale: Locale;
    t: (key: string) => string;
    tCommon: (key: string) => string;
}

function UpcomingUnlockItem({ item, onView, locale, t, tCommon }: UpcomingUnlockItemProps) {
    const title = item.metadata?.title || tCommon(item.type === 'text' ? 'textNote' : 'image');
    const unlockTime = useMemo(() => new Date(item.decrypt_at), [item.decrypt_at]);
    const timeRemaining = useMemo(() => item.decrypt_at - Date.now(), [item.decrypt_at]);

    // Determine urgency for styling
    const isVeryUrgent = timeRemaining < 60 * 60 * 1000; // < 1 hour
    const isUrgent = timeRemaining < 3 * 60 * 60 * 1000; // < 3 hours

    return (
        <div
            className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                isVeryUrgent && "border-green-500/30 bg-green-500/5",
                isUrgent && !isVeryUrgent && "border-warning/30 bg-warning/5",
                !isUrgent && "border-border bg-background/50"
            )}
            onClick={() => onView?.(item.id)}
        >
            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground truncate">{title}</div>
                <div className={cn(
                    "text-xs mt-0.5",
                    isVeryUrgent && "text-green-500 font-medium",
                    isUrgent && !isVeryUrgent && "text-warning",
                    !isUrgent && "text-muted-foreground"
                )}>
                    {formatDistanceToNow(unlockTime, { locale, addSuffix: true })}
                </div>
            </div>

            <button
                className="ml-3 p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onView?.(item.id);
                }}
            >
                <ArrowRight size={16} />
            </button>
        </div>
    );
}
