/**
 * CountdownVisuals Component
 *
 * Minimal countdown display following UI.md design system:
 * - No infinite animations
 * - Color changes only for urgency indication
 * - Clean, readable typography
 */

'use client';

import { useCountdown } from '@/hooks/useCountdown';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownVisualsProps {
    targetDate: number;
    className?: string;
    showIcon?: boolean;
}

export default function CountdownVisuals({
    targetDate,
    className,
    showIcon = true
}: CountdownVisualsProps) {
    const timeLeft = useCountdown(targetDate);

    // Calculate time thresholds
    const oneHour = 60 * 60 * 1000;
    const tenMinutes = 10 * 60 * 1000;
    const oneMinute = 60 * 1000;

    const isLastHour = timeLeft > 0 && timeLeft <= oneHour;
    const isLastTenMinutes = timeLeft > 0 && timeLeft <= tenMinutes;
    const isLastMinute = timeLeft > 0 && timeLeft <= oneMinute;

    // Format time display
    const formatTime = (ms: number): string => {
        if (ms <= 0) return '00:00:00';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const pad = (n: number) => n.toString().padStart(2, '0');

        if (days > 0) {
            return `${days}d ${pad(hours % 24)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
        }
        return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
    };

    // Color state based on time remaining - static, no animations
    const getColorClass = (): string => {
        if (timeLeft <= 0) return 'text-success';
        if (isLastMinute) return 'text-destructive';
        if (isLastTenMinutes) return 'text-warning';
        if (isLastHour) return 'text-warning';
        return 'text-muted-foreground';
    };

    // Badge style for critical states
    const getBadgeStyle = () => {
        if (isLastMinute) {
            return 'bg-destructive/10 text-destructive px-2 py-0.5 rounded';
        }
        if (isLastTenMinutes) {
            return 'bg-warning/10 text-warning px-2 py-0.5 rounded';
        }
        return '';
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {showIcon && (
                <div className={cn('flex-shrink-0', getColorClass())}>
                    <Clock className="w-[1em] h-[1em]" />
                </div>
            )}

            <span className={cn(
                'font-mono font-semibold tabular-nums',
                getColorClass(),
                getBadgeStyle()
            )}>
                {formatTime(timeLeft)}
            </span>

            {/* Urgency dot indicator - static */}
            {isLastMinute && (
                <div className="w-2 h-2 rounded-full bg-destructive" />
            )}
        </div>
    );
}
