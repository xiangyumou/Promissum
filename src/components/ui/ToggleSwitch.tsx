'use client';

import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    'aria-label': string;
    id?: string;
}

/**
 * Accessible Toggle Switch Component
 * 
 * Features:
 * - Full WAI-ARIA compliance with role="switch"
 * - Keyboard accessible (Space/Enter to toggle)
 * - Proper focus indicators
 * - Multiple sizes
 */
export default function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    'aria-label': ariaLabel,
    id,
}: ToggleSwitchProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!disabled) {
                onChange(!checked);
            }
        }
    };

    const sizeClasses = {
        sm: { track: 'w-10 h-5', thumb: 'w-4 h-4 top-0.5 left-0.5', translate: 'translate-x-5' },
        md: { track: 'w-12 h-6', thumb: 'w-4 h-4 top-1 left-1', translate: 'translate-x-6' },
        lg: { track: 'w-14 h-7', thumb: 'w-5 h-5 top-1 left-1', translate: 'translate-x-7' },
    };

    const { track, thumb, translate } = sizeClasses[size];

    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            onKeyDown={handleKeyDown}
            className={cn(
                track,
                "rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                checked ? 'bg-primary' : 'bg-muted',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <div
                className={cn(
                    thumb,
                    "absolute rounded-full bg-white transition-transform shadow-sm",
                    checked ? translate : 'translate-x-0'
                )}
            />
        </button>
    );
}
