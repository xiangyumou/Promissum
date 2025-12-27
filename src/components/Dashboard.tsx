'use client';

import { useStats } from '@/lib/queries';
import { Box, Lock, Unlock, FileText, Image as ImageIcon, Clock, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
    const { data: stats, isLoading, error } = useStats();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center h-full text-red-400">
                <p>Failed to load statistics</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Activity className="text-indigo-400" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">System Overview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Items"
                    value={stats.totalItems}
                    icon={<Box size={24} />}
                    color="text-indigo-400"
                    bg="bg-indigo-500/10"
                    border="border-indigo-500/20"
                />
                <StatCard
                    label="Encrypted"
                    value={stats.lockedItems}
                    icon={<Lock size={24} />}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    border="border-amber-500/20"
                />
                <StatCard
                    label="Unlocked"
                    value={stats.unlockedItems}
                    icon={<ShieldCheck size={24} />}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <StatCard
                    label="Text Notes"
                    value={stats.byType.text}
                    icon={<FileText size={24} />}
                    color="text-orange-400"
                    bg="bg-orange-500/10"
                    border="border-orange-500/20"
                />
                <StatCard
                    label="Images"
                    value={stats.byType.image}
                    icon={<ImageIcon size={24} />}
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                    border="border-purple-500/20"
                />
            </div>

            {stats.avgLockDurationMinutes !== undefined && (
                <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <Clock size={28} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Average Lock Duration</div>
                            <div className="text-xs text-zinc-500 mt-1">Based on historical data</div>
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-white tabular-nums">
                        {Math.round(stats.avgLockDurationMinutes / 60)}<span className="text-lg text-zinc-500 font-normal ml-1">hours</span>
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
            <div className="text-3xl font-bold text-white mb-1 tabular-nums">
                {value}
            </div>
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                {label}
            </div>
        </div>
    )
}
