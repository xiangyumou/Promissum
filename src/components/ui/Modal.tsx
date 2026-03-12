'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Accessible Modal Component using Radix UI Dialog
 *
 * Features:
 * - Full WAI-ARIA compliance
 * - Focus trapping and restoration
 * - Keyboard navigation (ESC to close)
 * - Minimal animation following UI.md spec
 */
export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const isMobile = useMediaQuery('(max-width: 767px)', false);

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {isOpen && (
                <Dialog.Portal>
                    {/* Overlay - minimal blur */}
                    <Dialog.Overlay
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-200"
                        onClick={onClose}
                    />

                    {/* Content Container */}
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 pointer-events-none">
                        <Dialog.Content
                            className={cn(
                                "bg-background border border-border w-full flex flex-col overflow-hidden outline-none pointer-events-auto",
                                // Desktop: centered modal
                                "md:rounded-lg md:max-w-lg md:max-h-[90vh]",
                                // Mobile: bottom sheet style
                                "max-md:rounded-t-xl max-md:max-h-[90dvh] max-md:border-b-0",
                                "animate-in fade-in zoom-in-95 duration-200",
                                className
                            )}
                            onPointerDownOutside={onClose}
                            onEscapeKeyDown={onClose}
                        >
                            {/* Drag handle for mobile */}
                            {isMobile && (
                                <div className="flex justify-center py-2">
                                    <div className="w-10 h-1 bg-muted rounded-full" />
                                </div>
                            )}

                            {/* Header */}
                            <div className={cn(
                                "flex items-center justify-between border-b border-border",
                                isMobile ? "px-5 py-3" : "p-5"
                            )}>
                                <Dialog.Title className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    {title}
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                    <button
                                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label="Close"
                                    >
                                        <X size={18} />
                                    </button>
                                </Dialog.Close>
                            </div>

                            {/* Content */}
                            <div className={cn(
                                "p-0 text-foreground overflow-y-auto flex-1",
                                isMobile && "pb-safe"
                            )}>
                                {children}
                            </div>
                        </Dialog.Content>
                    </div>
                </Dialog.Portal>
            )}
        </Dialog.Root>
    );
}
