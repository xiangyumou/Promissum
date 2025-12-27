'use client';

import Modal from './ui/Modal';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

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
                    <div className={`p-4 rounded-full ${variant === 'danger' ? 'bg-red-500/10 text-red-500' :
                            variant === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-blue-500/10 text-blue-500'
                        }`}>
                        <AlertTriangle size={32} />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors"
                    >
                        {cancelLabel || tCommon('cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all transform active:scale-[0.98] ${variant === 'danger'
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                                : 'bg-primary hover:bg-primary/90 shadow-primary/25'
                            }`}
                    >
                        {confirmLabel || tCommon('confirm')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
