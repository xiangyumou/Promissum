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
import { MS_PER_HOUR, MS_PER_MINUTE } from '@/lib/constants';
import { formatTime } from '@/core/time';

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
    const oneHour = MS_PER_HOUR;
    const tenMinutes = 10 * MS_PER_MINUTE;
    const oneMinute = MS_PER_MINUTE;

    const isLastHour = timeLeft > 0 && timeLeft <= oneHour;
    const isLastTenMinutes = timeLeft > 0 && timeLeft <= tenMinutes;
    const isLastMinute = timeLeft > 0 && timeLeft <= oneMinute;

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
