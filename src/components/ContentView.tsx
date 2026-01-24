'use client';

import { ApiItemDetail } from '@/lib/types';
import { Lock, Unlock, Clock, FileText, Image as ImageIcon, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { formatUnlockTime } from '@/lib/date-utils';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { useState } from 'react';

import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import CountdownVisuals from './CountdownVisuals';

import { timeService } from '@/lib/services/time-service';
import { useUnlockCelebration } from '@/hooks/useUnlockCelebration';

import DeleteButton from './content-view/DeleteButton';
import ExtendButton from './content-view/ExtendButton';

interface ContentViewProps {
    selectedId: string | null;
    item?: ApiItemDetail;
    isLoading: boolean;
    onDelete: (id: string) => void;
    onExtend: (id: string, additionalMinutes: number) => void;
    onMenuClick?: () => void;
}

export default function ContentView({ selectedId, item, isLoading, onDelete, onExtend, onMenuClick }: ContentViewProps) {
    const t = useTranslations('ContentView');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    // Track unlock status and trigger celebration
    useUnlockCelebration(item);

    // Image lightbox state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // No item selected state -> Show welcome message
    if (!selectedId) {
        return (
            <div className="h-full overflow-y-auto bg-background custom-scrollbar relative flex-1 w-full">
                {/* Global Controls */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                </div>

                {/* Menu Button - Mobile Only */}
                <div className="absolute top-4 left-4 z-50 md:hidden">
                    <button
                        onClick={onMenuClick}
                        aria-label="Open menu"
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
                            aria-label="Open menu"
                            className={cn(
                                "p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
                            )}
                        >
                            <Menu size={20} />
                        </button>

                        <div className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl shadow-lg shrink-0",
                            item.type === 'text'
                                ? "bg-type-text/10 text-type-text border border-type-text/20"
                                : "bg-type-image/10 text-type-image border border-type-image/20"
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
                                        ? "bg-success/10 text-success border-success/20"
                                        : "bg-warning/10 text-warning border-warning/20"
                                )}>
                                    {isUnlocked ? <Unlock size={10} /> : <Lock size={10} />}
                                    {isUnlocked ? tCommon('unlocked') : tCommon('locked')}
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <Clock size={10} />
                                    {formatUnlockTime(item.decrypt_at, locale)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
                        {/* Theme & Language Controls */}
                        <div className="hidden md:flex items-center gap-1 border-r border-border pr-2 mr-2">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>

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
        </div >
    );
}
