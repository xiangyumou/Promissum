'use client';

import Modal from './Modal';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    const icons = {
        danger: <AlertCircle size={24} />,
        warning: <AlertTriangle size={24} />,
        info: <Info size={24} />
    };

    const variantStyles = {
        danger: {
            icon: 'bg-red-500/10 text-red-400',
            button: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
        },
        warning: {
            icon: 'bg-amber-500/10 text-amber-400',
            button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
        },
        info: {
            icon: 'bg-blue-500/10 text-blue-400',
            button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={isLoading ? () => { } : onClose} title={title} className="max-w-md">
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-full shrink-0", variantStyles[variant].icon)}>
                        {icons[variant]}
                    </div>
                    <div className="flex-1 pt-0.5">
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-zinc-400 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "px-4 py-2 text-sm font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 transform active:scale-95",
                            variantStyles[variant].button
                        )}
                    >
                        {isLoading && <span className="animate-spin">⏳</span>}
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
