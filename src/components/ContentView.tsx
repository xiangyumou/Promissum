'use client';

import { ItemDetail } from '@/lib/types';
import { Lock, Unlock, Clock, FileText, Image as ImageIcon, Trash2, Maximize2, X, Plus, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

import { useSettings } from '@/lib/stores/settings-store';
import { PanelLeftOpen } from 'lucide-react';

interface ContentViewProps {
    selectedId: string | null;
    item?: ItemDetail;
    isLoading: boolean;
    onDelete: (id: string) => void;
    onExtend: (id: string, additionalMinutes: number) => void;
    onMenuClick?: () => void;
}

// ...

export default function ContentView({ selectedId, item, isLoading, onDelete, onExtend, onMenuClick }: ContentViewProps) {
    const t = useTranslations('ContentView');
    const tCommon = useTranslations('Common');
    const { sidebarOpen, setSidebarOpen } = useSettings();

    // No item selected state -> Show welcome message
    if (!selectedId) {
        return (
            <div className="h-full overflow-y-auto bg-background custom-scrollbar relative flex-1 w-full">
                {/* Menu Button - Mobile & Desktop (when collapsed) */}
                <div className="absolute top-4 left-4 z-50">
                    <button
                        onClick={() => {
                            if (window.innerWidth >= 768) {
                                setSidebarOpen(true);
                            } else {
                                onMenuClick?.();
                            }
                        }}
                        className={cn(
                            "p-2 bg-card/50 backdrop-blur-md rounded-lg border border-border text-foreground hover:bg-accent transition-colors",
                            // Show on mobile OR on desktop if sidebar is closed
                            "md:opacity-100",
                            // If sidebar is open on desktop, hide this button? 
                            // Yes, usually.
                            sidebarOpen && "md:opacity-0 md:pointer-events-none"
                        )}
                    >
                        {sidebarOpen ? <Menu size={20} /> : <PanelLeftOpen size={20} />}
                        {/* Actually on mobile it's always Menu/Open. On desktop if closed it's PanelLeftOpen. */}
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

    const isUnlocked = Date.now() >= item.decrypt_at;

    // Derive image source if type is image and item is unlocked
    // The API route already adds the data URL prefix if needed
    const imageSrc = item.type === 'image' && item.content
        ? (item.content.startsWith('data:') ? item.content : `data:image/png;base64,${item.content}`)
        : '';

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden flex-1 w-full">
            {/* Header / Meta Info */}
            <div className="shrink-0 p-6 border-b border-border bg-card/30 backdrop-blur-xl z-20">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Mobile & Desktop Menu Button */}
                        <button
                            onClick={() => {
                                if (window.innerWidth >= 768) {
                                    setSidebarOpen(true);
                                } else {
                                    onMenuClick?.();
                                }
                            }}
                            className={cn(
                                "p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                                // Show on mobile OR on desktop if sidebar is closed
                                "md:opacity-100",
                                sidebarOpen && "md:opacity-0 md:pointer-events-none md:hidden"
                            )}
                        >
                            {sidebarOpen ? <Menu size={20} /> : <PanelLeftOpen size={20} />}
                        </button>

                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg",
                            item.type === 'text'
                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        )}>
                            {item.type === 'text' ? <FileText size={24} /> : <ImageIcon size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">
                                {item.metadata?.title ||
                                    (item.type === 'text' ? tCommon('textNote') : (item.original_name || tCommon('image')))}
                            </h2>
                            <div className="flex items-center gap-2 mt-1 text-sm">                                <span className={cn(
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
                                    {new Date(item.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                                    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-border bg-black/50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imageSrc}
                                            alt="Decrypted content"
                                            className="max-h-[70vh] w-auto object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                            <a
                                                href={imageSrc}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-transform hover:scale-110 backdrop-blur-md border border-white/10"
                                                title={t('viewOriginal')}
                                            >
                                                <Maximize2 size={24} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                <div className="text-3xl font-mono font-bold text-amber-500 tabular-nums tracking-tight">
                                    <Countdown targetDate={item.decrypt_at} />
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5 opacity-70">
                                    <Clock size={12} />
                                    {new Date(item.decrypt_at).toLocaleString()}
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

    const handleClick = () => {
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

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExtend = (minutes: number) => {
        onExtend(minutes);
        setIsOpen(false);
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
                                onClick={() => handleExtend(opt.val)}
                                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors flex items-center justify-between group"
                            >
                                <span>{opt.label}</span>
                                <Plus size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Countdown({ targetDate }: { targetDate: number }) {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, targetDate - Date.now()));

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = targetDate - Date.now();
            setTimeLeft(Math.max(0, diff));
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (timeLeft <= 0) return <>00:00:00</>;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (days > 0) return <>{days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}</>;
    return <>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</>;
}

