/**
 * CountdownVisuals Component
 * 
 * Progressive countdown display with time-based visual effects:
 * - Last hour: color gradient yellow → green
 * - Last 10 minutes: pulse animation
 * - Last minute: jumping/bouncing animation
 */

'use client';

import { useCountdown } from '@/hooks/useCountdown';
import { motion } from 'framer-motion';
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

    // Calculate progress percentage for gradient (0-100)
    const progressPercent = isLastHour
        ? Math.max(0, Math.min(100, (timeLeft / oneHour) * 100))
        : 100;

    // Format time display
    const formatTime = (ms: number): string => {
        if (ms <= 0) return '00:00:00';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const pad = (n: number) => n.toString().padStart(2, '0');

        return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
    };

    // Dynamic color based on time remaining
    const getColorClass = (): string => {
        if (timeLeft <= 0) return 'text-green-500 dark:text-green-400';
        if (isLastMinute) return 'text-red-500 dark:text-red-400';
        if (isLastTenMinutes) return 'text-orange-500 dark:text-orange-400';
        if (isLastHour) return 'text-yellow-500 dark:text-yellow-400';
        return 'text-muted-foreground';
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {showIcon && (
                <motion.div
                    animate={
                        isLastMinute
                            ? {
                                // Jumping animation
                                y: [0, -8, 0],
                                scale: [1, 1.1, 1],
                            }
                            : isLastTenMinutes
                                ? {
                                    // Pulse animation
                                    scale: [1, 1.15, 1],
                                }
                                : {}
                    }
                    transition={
                        isLastMinute
                            ? {
                                duration: 0.6,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }
                            : isLastTenMinutes
                                ? {
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }
                                : {}
                    }
                    className={cn('flex-shrink-0', getColorClass())}
                >
                    <Clock size={16} />
                </motion.div>
            )}

            <motion.span
                animate={
                    isLastMinute
                        ? {
                            // Text jumping
                            y: [0, -4, 0],
                        }
                        : {}
                }
                transition={
                    isLastMinute
                        ? {
                            duration: 0.6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }
                        : {}
                }
                className={cn(
                    'text-sm font-mono font-medium tabular-nums transition-colors duration-300',
                    getColorClass()
                )}
                style={
                    isLastHour && timeLeft > 0
                        ? {
                            // Gradient from yellow to green
                            background: `linear-gradient(90deg, 
                                  hsl(${progressPercent * 1.2}, 80%, 50%) 0%, 
                                  hsl(${120 - progressPercent * 1.2}, 70%, 45%) 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }
                        : undefined
                }
            >
                {formatTime(timeLeft)}
            </motion.span>

            {/* Urgency indicator */}
            {isLastMinute && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"
                    style={{
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                    }}
                />
            )}
        </div>
    );
}
