'use client';

import { ApiItemDetail } from '@/lib/types';
import { Lock, Unlock, Clock, FileText, Image as ImageIcon, Trash2, Plus, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { formatDateTime, formatUnlockTime } from '@/lib/date-utils';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

import { useSettings } from '@/lib/stores/settings-store';
import { PanelLeftOpen } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { timeService } from '@/lib/services/time-service';
import { useCountdown } from '@/hooks/useCountdown';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useSessions } from '@/hooks/useSessions';
import { Users } from 'lucide-react';
import CountdownVisuals from './CountdownVisuals';

interface ContentViewProps {
    selectedId: string | null;
    item?: ApiItemDetail;
    isLoading: boolean;
    onDelete: (id: string) => void;
    onExtend: (id: string, additionalMinutes: number) => void;
    onMenuClick?: () => void;
}

// ...

export default function ContentView({ selectedId, item, isLoading, onDelete, onExtend, onMenuClick }: ContentViewProps) {
    const t = useTranslations('ContentView');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const { sidebarOpen, setSidebarOpen, enableUnlockSound, enableUnlockConfetti } = useSettings();

    // Track active session
    useActiveSession(selectedId);

    // Track unlock status and trigger celebration
    const [wasLocked, setWasLocked] = useState(true);

    useEffect(() => {
        if (!item) return;

        const isNowUnlocked = timeService.now() >= item.decrypt_at;

        // Trigger unlock effects when transitioning from locked to unlocked
        if (wasLocked && isNowUnlocked) {
            // Dynamic import to avoid SSR issues
            import('@/lib/utils/unlock-effects').then(({ celebrateUnlock }) => {
                celebrateUnlock({
                    sound: enableUnlockSound,
                    confetti: enableUnlockConfetti,
                });
            });
        }

        setWasLocked(!isNowUnlocked);
    }, [item, wasLocked, enableUnlockSound, enableUnlockConfetti]);


    // Image lightbox state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // No item selected state -> Show welcome message
    if (!selectedId) {
        return (
            <div className="h-full overflow-y-auto bg-background custom-scrollbar relative flex-1 w-full">
                {/* Menu Button - Mobile Only */}
                <div className="absolute top-4 left-4 z-50 md:hidden">
                    <button
                        onClick={onMenuClick}
                        className={cn(
                            "p-2 bg-card/50 backdrop-blur-md rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
                        )}
                    >
                        <Menu size={20} />
                    </button>
                </div>
                <div className="flex items-center justify-center h-full p-6">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                            <FileText size={40} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">{tCommon('dashboard')}</h2>
                        <p className="text-muted-foreground">
                            {t('selectItem')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full flex-1 space-y-4">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground animate-pulse">{t('decrypting')}</p>
            </div>
        );
    }

    // Not found state
    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="p-4 bg-accent rounded-full mb-3">
                    <FileText size={32} className="opacity-50" />
                </div>
                <p>{t('notFound')}</p>
            </div>
        );
    }

    const isUnlocked = timeService.now() >= item.decrypt_at;

    // Derive image source if type is image and item is unlocked
    // The API route already adds the data URL prefix if needed
    const imageSrc = item.type === 'image' && item.content
        ? (item.content.startsWith('data:') ? item.content : `data:image/png;base64,${item.content}`)
        : '';

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden flex-1 w-full">
            {/* Header / Meta Info */}
            <div className="shrink-0 p-4 md:p-6 border-b border-border bg-card/30 backdrop-blur-xl z-20">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={onMenuClick}
                            className={cn(
                                "p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
                            )}
                        >
                            <Menu size={20} />
                        </button>

                        <div className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl shadow-lg shrink-0",
                            item.type === 'text'
                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        )}>
                            {item.type === 'text' ? <FileText size={20} className="md:w-6 md:h-6" /> : <ImageIcon size={20} className="md:w-6 md:h-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight truncate">
                                {item.metadata?.title ||
                                    (item.type === 'text' ? tCommon('textNote') : tCommon('image'))}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                                <span className={cn(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-xs border",
                                    isUnlocked
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}>
                                    {isUnlocked ? <Unlock size={10} /> : <Lock size={10} />}
                                    {isUnlocked ? tCommon('unlocked') : tCommon('locked')}
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <Clock size={10} />
                                    {formatUnlockTime(item.decrypt_at, locale)}
                                </span>
                                <ViewerCount itemId={item.id} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
                        <ExtendButton onExtend={(mins) => onExtend(item.id, mins)} />
                        <DeleteButton id={item.id} onDelete={onDelete} />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {isUnlocked ? (
                    <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {item.type === 'text' ? (
                                <div className="glass-card rounded-2xl p-8 border border-border shadow-xl min-h-[50vh]">
                                    <div className="prose prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                                        {item.content}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div
                                        className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-black/50 cursor-pointer group"
                                        onClick={() => setIsLightboxOpen(true)}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imageSrc}
                                            alt="Decrypted content"
                                            className="max-h-[70vh] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Professional Image Lightbox */}
                            <Lightbox
                                open={isLightboxOpen}
                                close={() => setIsLightboxOpen(false)}
                                slides={[{ src: imageSrc }]}
                                plugins={[Zoom]}
                                zoom={{
                                    maxZoomPixelRatio: 3,
                                    scrollToZoom: true,
                                }}
                                carousel={{ finite: true }}
                                controller={{ closeOnBackdropClick: true }}
                                render={{
                                    buttonPrev: () => null,
                                    buttonNext: () => null,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="text-center space-y-6 max-w-md w-full animate-in fade-in zoom-in duration-500">
                            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-muted/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin duration-[3s]"></div>
                                <div className="bg-background rounded-full p-6 shadow-2xl z-10 border border-border">
                                    <Lock size={48} className="text-amber-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-foreground">{t('contentEncrypted')}</h3>
                                <p className="text-muted-foreground">{t('timeLockActive')}</p>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-xl border border-border backdrop-blur-md">
                                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-bold">{t('unlocksIn')}</div>
                                <div className="flex justify-center">
                                    <CountdownVisuals
                                        targetDate={item.decrypt_at}
                                        className="text-3xl"
                                        showIcon={false}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5 opacity-70">
                                    <Clock size={12} />
                                    {formatUnlockTime(item.decrypt_at, locale)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DeleteButton({ id, onDelete }: { id: string, onDelete: (id: string) => void }) {
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

function ExtendButton({ onExtend }: { onExtend: (minutes: number) => void }) {
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
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                    isOpen
                        ? "bg-accent text-accent-foreground border-border"
                        : "bg-transparent text-muted-foreground border-transparent hover:bg-accent hover:text-foreground hover:border-border"
                )}
                title={t('extendLock')}
            >
                <Clock size={16} />
                <span className="hidden sm:inline">{t('extend')}</span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-popover rounded-xl shadow-xl border border-border overflow-hidden z-50 p-1"
                    >
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('addTime')}</div>
                        {[
                            { label: `+10 ${t('minutes')}`, val: 10 },
                            { label: `+1 ${t('hour')}`, val: 60 },
                            { label: `+6 ${t('hours')}`, val: 360 },
                            { label: `+24 ${t('hours')}`, val: 1440 }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => handleExtendClick(opt.val)}
                                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center justify-between group"
                            >
                                <span>{opt.label}</span>
                                <Plus size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

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



function ViewerCount({ itemId }: { itemId: string }) {
    const { data: sessions } = useSessions(itemId);

    // Only show if there are other viewers (count > 1) or just show total?
    // Let's show total for verification.
    if (!sessions || sessions.length === 0) return null;

    return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium text-xs border bg-blue-500/10 text-blue-500 border-blue-500/20" title="Active viewers on this device">
            <Users size={10} />
            {sessions.length} {sessions.length === 1 ? 'viewer' : 'viewers'}
        </span>
    );
}

