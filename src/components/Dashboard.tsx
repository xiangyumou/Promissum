'use client';

import { useStats } from '@/lib/queries';
import { Box, Lock, Unlock, FileText, Image as ImageIcon, Clock, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function Dashboard() {
    const { data: stats, isLoading, error } = useStats();
    const t = useTranslations('Dashboard');
    const tCommon = useTranslations('Common');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center h-full text-destructive">
                <p>{t('failedToLoad')}</p>
            </div>
        );
    }

    return (
        <div className="p-8 w-full space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="text-primary" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{t('systemOverview')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label={t('totalItems')}
                    value={stats.totalItems}
                    icon={<Box size={24} />}
                    color="text-primary"
                    bg="bg-primary/10"
                    border="border-primary/20"
                />
                <StatCard
                    label={t('encrypted')}
                    value={stats.lockedItems}
                    icon={<Lock size={24} />}
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
                <StatCard
                    label={t('unlocked')}
                    value={stats.unlockedItems}
                    icon={<ShieldCheck size={24} />}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <StatCard
                    label={t('textNotes')}
                    value={stats.byType.text}
                    icon={<FileText size={24} />}
                    color="text-orange-500"
                    bg="bg-orange-500/10"
                    border="border-orange-500/20"
                />
                <StatCard
                    label={t('images')}
                    value={stats.byType.image}
                    icon={<ImageIcon size={24} />}
                    color="text-purple-500"
                    bg="bg-purple-500/10"
                    border="border-purple-500/20"
                />
            </div>

            {stats.avgLockDurationMinutes !== undefined && (
                <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <Clock size={28} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('averageLockDuration')}</div>
                            <div className="text-xs text-muted-foreground/70 mt-1">{t('basedOnHistory')}</div>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-foreground tabular-nums">
                        {Math.round(stats.avgLockDurationMinutes / 60)}<span className="text-lg text-muted-foreground font-normal ml-1">{t('hours')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color, bg, border }: { label: string, value: number, icon: React.ReactNode, color: string, bg: string, border: string }) {
    return (
        <div className={cn(
            "glass-card p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]",
            border
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl", bg, color)}>
                    {icon}
                </div>
                {/* Optional sparkline or indicator could go here */}
            </div>
            <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                {value}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {label}
            </div>
        </div>
    )
}
