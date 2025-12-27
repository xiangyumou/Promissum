'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

// Simple useMediaQuery hook for detecting mobile
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const dragControls = useDragControls();

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const mounted = useRef(false);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    // Handle drag end for bottom sheet
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    if (!isOpen) return <AnimatePresence />;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end md:items-center justify-center md:p-4"
                        onClick={onClose}
                    >
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
                                "bg-background border border-border shadow-2xl w-full flex flex-col overflow-hidden",
                                // Mobile: bottom sheet style
                                "md:rounded-2xl md:max-w-lg md:max-h-[90vh]",
                                // Mobile specific
                                "max-md:rounded-t-3xl max-md:max-h-[90dvh] max-md:border-b-0",
                                className
                            )}
                            onClick={(e) => e.stopPropagation()}
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
                                <h2 className="text-xl font-bold text-foreground tracking-tight">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className={cn(
                                "p-0 text-foreground overflow-y-auto flex-1",
                                isMobile && "pb-safe"
                            )}>
                                {children}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    // Using createPortal to append to body to avoid z-index fighting
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }

    return null;
}

