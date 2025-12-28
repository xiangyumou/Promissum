'use client';

import { useState, useMemo } from 'react';
import Modal from './ui/Modal';
import { cn } from '@/lib/utils';
import {
    Clock,
    RefreshCw,
    Plus,
    Lock,
    HourglassIcon
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BatchExtendDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (minutes: number) => void;
    itemCount: number;
}

// Duration presets in minutes
const DURATION_PRESETS = [
    { label: '10m', minutes: 10 },
    { label: '1h', minutes: 60 },
    { label: '6h', minutes: 360 },
    { label: '1d', minutes: 1440 },
    { label: '3d', minutes: 4320 },
];

export default function BatchExtendDialog({ isOpen, onClose, onConfirm, itemCount }: BatchExtendDialogProps) {
    const t = useTranslations('AddModal'); // Reusing existing translations where possible
    const tSidebar = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');

    const [duration, setDuration] = useState(60);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePresetClick = (minutes: number) => {
        setDuration(prev => prev + minutes);
    };

    const handleCustomDurationChange = (value: string) => {
        const num = Math.max(0, parseInt(value) || 0);
        setDuration(num);
    };

    const handleResetDuration = () => {
        setDuration(60);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (duration <= 0) return;

        setIsSubmitting(true);
        // Simulate async if needed, but here we just pass data up
        // The parent handles the promise usually
        onConfirm(duration);
        setIsSubmitting(false);
        onClose();
        setDuration(60); // Reset for next time
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={tSidebar('batchExtend')}
            className="md:max-w-[450px]"
        >
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3 mb-4">
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                        <HourglassIcon size={24} />
                    </div>
                    <p className="text-muted-foreground">
                        {tSidebar('batchExtendDesc', { count: itemCount })}
                    </p>
                </div>

                {/* Duration Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock size={16} />
                            {t('lockDuration')}
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {DURATION_PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    className="px-3 py-1.5 bg-accent/30 hover:bg-accent border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                    onClick={() => handlePresetClick(preset.minutes)}
                                >
                                    <Plus size={10} />
                                    {preset.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full text-xs font-medium transition-colors flex items-center gap-1 border border-destructive/20"
                                onClick={handleResetDuration}
                            >
                                <RefreshCw size={10} />
                                {t('reset')}
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                value={duration || ''}
                                placeholder="0"
                                onChange={(e) => handleCustomDurationChange(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-lg text-foreground"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors"
                    >
                        {tCommon('cancel')}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-3 text-white rounded-xl premium-button"
                        disabled={isSubmitting || duration <= 0}
                    >
                        {isSubmitting ? (
                            <RefreshCw size={18} className="animate-spin" />
                        ) : (
                            <>
                                <Lock size={18} className="mr-2 inline" />
                                {tCommon('confirm')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
