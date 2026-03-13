'use client';

import Modal from './Modal';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'danger',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const tCommon = useTranslations('Common');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            className="max-w-[400px]"
        >
            <div className="p-6 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className={cn(
                        "p-3 rounded-full",
                        variant === 'danger' ? 'bg-destructive/10 text-destructive' :
                            variant === 'warning' ? 'bg-warning/10 text-warning' :
                                'bg-info/10 text-info'
                    )}>
                        <AlertTriangle size={24} />
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 btn btn-secondary"
                    >
                        {cancelLabel || tCommon('cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={cn(
                            "flex-1 btn",
                            variant === 'danger' ? 'btn-destructive' : 'btn-primary'
                        )}
                    >
                        {confirmLabel || tCommon('confirm')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
