'use client';

import { useMemo } from 'react';
import { useStats } from '@/lib/queries';
import { Box, Lock, Unlock, FileText, Image as ImageIcon, Clock, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/stores/settings-store';
import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import UpcomingUnlocks from './UpcomingUnlocks';
import TrendChart from './TrendChart';
import { useRouter } from '@/i18n/routing';

export default function Dashboard() {
    const { data: stats, isLoading, error } = useStats();
    const t = useTranslations('Dashboard');
    const tCommon = useTranslations('Common');
    const { privacyMode } = useSettings();
    const router = useRouter();

    const handleViewItem = (id: string) => {
        router.push(`/?item=${id}`);
    };

    const typeChartData = useMemo(() => [
        { name: t('textNotes'), value: stats?.byType?.text || 0, color: 'var(--warning)' },
        { name: t('images'), value: stats?.byType?.image || 0, color: 'var(--primary)' },
    ], [stats?.byType?.text, stats?.byType?.image, t]);

    const statusChartData = useMemo(() => [
        { name: t('encrypted'), value: stats?.lockedItems || 0, color: 'var(--warning)' },
        { name: t('unlocked'), value: stats?.unlockedItems || 0, color: 'var(--success)' },
    ], [stats?.lockedItems, stats?.unlockedItems, t]);

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
        <div className={cn(
            "p-4 md:p-8 w-full space-y-4 md:space-y-8 animate-in fade-in duration-500 transition-all duration-300",
            privacyMode && "blur-md hover:blur-0"
        )}>
            <div className="flex items-center gap-3 mb-4 md:mb-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="text-primary" size={24} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{t('systemOverview')}</h2>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                    color="text-warning"
                    bg="bg-warning/10"
                    border="border-warning/20"
                />
                <StatCard
                    label={t('unlocked')}
                    value={stats.unlockedItems}
                    icon={<ShieldCheck size={24} />}
                    color="text-success"
                    bg="bg-success/10"
                    border="border-success/20"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Type Distribution Chart */}
                <div className="glass-card p-6 rounded-2xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('contentTypeDistribution')}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={typeChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {typeChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4">
                        {typeChartData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Distribution Chart */}
                <div className="glass-card p-6 rounded-2xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">{t('lockStatusDistribution')}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={statusChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4">
                        {statusChartData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Average Duration Card */}
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

            {/* Upcoming Unlocks Section */}
            {stats.upcomingUnlocks && stats.upcomingUnlocks.length > 0 && (
                <UpcomingUnlocks items={stats.upcomingUnlocks} onView={handleViewItem} />
            )}

            {/* Trend Chart Section */}
            {stats.weeklyTrend && stats.weeklyTrend.length > 0 && (
                <TrendChart data={stats.weeklyTrend} variant="area" />
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
