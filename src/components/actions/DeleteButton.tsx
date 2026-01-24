'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/stores/settings-store';

interface DeleteButtonProps {
    id: string;
    onDelete: (id: string) => void;
}

export function DeleteButton({ id, onDelete }: DeleteButtonProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(null);
    const tCommon = useTranslations('Common');
    const { confirmDelete } = useSettings();

    const handleClick = () => {
        if (!confirmDelete) {
            onDelete(id);
            return;
        }

        if (isConfirming) {
            onDelete(id);
            setIsConfirming(false);
        } else {
            setIsConfirming(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setIsConfirming(false), 3000);
        }
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                isConfirming
                    ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            )}
            title={isConfirming ? tCommon('confirmDelete') : tCommon('delete')}
        >
            <Trash2 size={16} className={isConfirming ? "animate-pulse" : ""} />
            <AnimatePresence>
                {isConfirming && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
                    >
                        {tCommon('confirm')}
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
}
