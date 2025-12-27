'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMedia } from 'react-use';

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
 * - Mobile bottom sheet with drag-to-dismiss
 * - Framer Motion animations
 */
export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const isMobile = useMedia('(max-width: 767px)', false);
    const dragControls = useDragControls();

    // Handle drag end for bottom sheet
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
                            />
                        </Dialog.Overlay>

                        {/* Content Container - for positioning */}
                        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
                            <Dialog.Content asChild>
                                <motion.div
                                    initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 10 }}
                                    animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
                                    exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    drag={isMobile ? 'y' : false}
                                    dragControls={dragControls}
                                    dragConstraints={{ top: 0, bottom: 0 }}
                                    dragElastic={{ top: 0, bottom: 0.5 }}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        "bg-background border border-border shadow-2xl w-full flex flex-col overflow-hidden outline-none",
                                        // Desktop: centered modal
                                        "md:rounded-2xl md:max-w-lg md:max-h-[90vh]",
                                        // Mobile: bottom sheet style
                                        "max-md:rounded-t-3xl max-md:max-h-[90dvh] max-md:border-b-0",
                                        className
                                    )}
                                >
                                    {/* Drag handle for mobile */}
                                    {isMobile && (
                                        <div
                                            className="flex justify-center py-2 cursor-grab active:cursor-grabbing touch-none"
                                            onPointerDown={(e) => dragControls.start(e)}
                                        >
                                            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                                        </div>
                                    )}

                                    {/* Header */}
                                    <div className={cn(
                                        "flex items-center justify-between border-b border-border",
                                        isMobile ? "px-5 py-3" : "p-5"
                                    )}>
                                        <Dialog.Title className="text-xl font-bold text-foreground tracking-tight">
                                            {title}
                                        </Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button
                                                className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label="Close"
                                            >
                                                <X size={20} />
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
                                </motion.div>
                            </Dialog.Content>
                        </div>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
