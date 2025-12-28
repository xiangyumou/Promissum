'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface TrendData {
    date: string;
    count: number;
}

interface TrendChartProps {
    data: TrendData[];
    variant?: 'line' | 'area';
}

export default function TrendChart({ data, variant = 'area' }: TrendChartProps) {
    const t = useTranslations('Dashboard');

    // Format date for display (MM-DD)
    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
    }, [data]);

    const ChartComponent = variant === 'area' ? AreaChart : LineChart;
    const DataComponent = variant === 'area' ? Area : Line;

    return (
        <div className="glass-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="text-primary" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('creationTrend')}</h3>
                    <p className="text-xs text-muted-foreground">{t('creationTrendDesc')}</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
                <ChartComponent data={formattedData}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis
                        dataKey="displayDate"
                        stroke="var(--muted-foreground)"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    />
                    <YAxis
                        stroke="var(--muted-foreground)"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                        }}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                        itemStyle={{ color: 'var(--muted-foreground)' }}
                    />
                    {variant === 'area' ? (
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            fill="url(#colorCount)"
                            name={t('itemsCreated')}
                        />
                    ) : (
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            dot={{ fill: 'var(--primary)', r: 4 }}
                            activeDot={{ r: 6 }}
                            name={t('itemsCreated')}
                        />
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
}
