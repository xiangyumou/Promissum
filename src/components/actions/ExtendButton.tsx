'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/stores/settings-store';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ExtendButtonProps {
    onExtend: (minutes: number) => void;
}

export function ExtendButton({ onExtend }: ExtendButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('ContentView');
    const tCommon = useTranslations('Common');
    const { confirmExtend } = useSettings();

    const [confirmMinutes, setConfirmMinutes] = useState<number | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExtendClick = (minutes: number) => {
        if (confirmExtend) {
            setConfirmMinutes(minutes);
            setIsOpen(false);
        } else {
            onExtend(minutes);
            setIsOpen(false);
        }
    };

    const handleConfirm = () => {
        if (confirmMinutes) {
            onExtend(confirmMinutes);
            setConfirmMinutes(null);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "btn btn-ghost",
                    isOpen && "bg-accent text-foreground border border-border"
                )}
                title={t('extendLock')}
            >
                <Clock size={16} />
                <span className="hidden sm:inline">{t('extend')}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg border border-border overflow-hidden z-50 p-1 shadow-lg">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('addTime')}
                    </div>
                    {[
                        { label: `+10 ${t('minutes')}`, val: 10 },
                        { label: `+1 ${t('hour')}`, val: 60 },
                        { label: `+6 ${t('hours')}`, val: 360 },
                        { label: `+24 ${t('hours')}`, val: 1440 }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => handleExtendClick(opt.val)}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors flex items-center justify-between"
                        >
                            <span>{opt.label}</span>
                            <Plus size={12} className="text-primary" />
                        </button>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!confirmMinutes}
                title={t('confirmExtend', { minutes: confirmMinutes || 0 })}
                description={t('confirmExtendDesc', { minutes: confirmMinutes || 0 }) || t('confirmExtend', { minutes: confirmMinutes || 0 })}
                confirmLabel={tCommon('confirm')}
                variant="warning"
                onConfirm={handleConfirm}
                onCancel={() => setConfirmMinutes(null)}
            />
        </div>
    );
}
