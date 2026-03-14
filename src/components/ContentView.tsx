'use client';

import { Item, ContentBundle, detectContentType, getContentTypeIcon } from '@/lib/types';
import { Lock, Unlock, Clock, FileText, Image as ImageIcon, Menu, File, Layers, Download, Film, Music, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { formatUnlockTime, getItemDisplayTitle } from '@/core/time';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { useState, useMemo, useEffect } from 'react';

import ThemeToggle from './shared/ThemeToggle';
import LanguageSwitcher from './shared/LanguageSwitcher';
import CountdownVisuals from './shared/CountdownVisuals';
import { DeleteButton } from './DeleteButton';

interface ContentViewProps {
    selectedId: string | null;
    item?: Item;
    isLoading: boolean;
    onDelete: (id: string) => void;
    onMenuClick?: () => void;
}

// Icon mapping
const iconComponents: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    FileText,
    Image: ImageIcon,
    File,
    Layers,
    Film,
    Music,
    Archive,
};

// Hook to track unlock status without calling Date.now() during render
function useUnlockStatus(decryptAt: number | undefined): boolean {
    const [isUnlocked, setIsUnlocked] = useState(false);

    useEffect(() => {
        if (decryptAt === undefined) return;
        const checkUnlock = () => setIsUnlocked(Date.now() >= decryptAt);
        checkUnlock();
        const interval = setInterval(checkUnlock, 1000);
        return () => clearInterval(interval);
    }, [decryptAt]);

    return isUnlocked;
}

export default function ContentView({ selectedId, item, isLoading, onDelete, onMenuClick }: ContentViewProps) {
    const t = useTranslations('ContentView');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    // Image lightbox state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Track unlock status using custom hook (safe to call before early returns)
    const isUnlocked = useUnlockStatus(item?.decrypt_at);

    // Parse content bundle
    const contentBundle = useMemo(() => {
        if (!item?.content) return null;
        return item.content as ContentBundle;
    }, [item?.content]);

    // Detect content type
    const contentType = useMemo(() => {
        if (!contentBundle) return 'file';
        return detectContentType(contentBundle);
    }, [contentBundle]);

    // Get images for lightbox
    const images = useMemo(() => {
        if (!contentBundle?.files) return [];
        return contentBundle.files
            .filter(f => f.mimeType.startsWith('image/'))
            .map(f => `data:${f.mimeType};base64,${f.data}`);
    }, [contentBundle]);

    // Get icon component
    const iconName = getContentTypeIcon(contentType);
    const TypeIcon = iconComponents[iconName] || File;

    // No item selected state -> Show welcome message
    if (!selectedId) {
        return (
            <div className="h-full overflow-y-auto bg-background relative flex-1 w-full">
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
                        className="p-2 bg-card border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>
                <div className="flex items-center justify-center h-full p-6">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                            <FileText size={40} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                            {tCommon('dashboard')}
                        </h2>
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
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">{t('decrypting')}</p>
            </div>
        );
    }

    // Not found state
    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="p-4 bg-card rounded-full mb-3">
                    <FileText size={32} className="opacity-50" />
                </div>
                <p>{t('notFound')}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden flex-1 w-full">
            {/* Header / Meta Info */}
            <div className="shrink-0 p-4 md:p-6 border-b border-border bg-card z-20">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={onMenuClick}
                            aria-label="Open menu"
                            className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Type Icon - Monochrome */}
                        <div className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl shrink-0",
                            "bg-accent border border-border text-muted-foreground"
                        )}>
                            <TypeIcon size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                {getItemDisplayTitle(item, tCommon)}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                                {/* Status Badge */}
                                <span className={cn(
                                    "badge",
                                    isUnlocked ? "badge-success" : "badge-warning"
                                )}>
                                    {isUnlocked ? <Unlock size={10} className="mr-1" /> : <Lock size={10} className="mr-1" />}
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

                        <DeleteButton id={item.id} onDelete={onDelete} />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {isUnlocked ? (
                    <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Text Content */}
                            {contentBundle?.text && (
                                <div className="card">
                                    <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                                        {contentBundle.text}
                                    </div>
                                </div>
                            )}

                            {/* Files */}
                            {contentBundle?.files && contentBundle.files.length > 0 && (
                                <div className="space-y-4">
                                    {/* Image Gallery */}
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {images.map((src, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative aspect-square rounded-xl overflow-hidden border border-border bg-black/50 cursor-pointer group"
                                                    onClick={() => {
                                                        setLightboxIndex(idx);
                                                        setIsLightboxOpen(true);
                                                    }}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={src}
                                                        alt={`Image ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* File List */}
                                    <div className="card">
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                            {t('attachments')}
                                        </h3>
                                        <div className="space-y-2">
                                            {contentBundle.files.map((file, idx) => {
                                                const isImage = file.mimeType.startsWith('image/');

                                                return (
                                                    <div
                                                        key={file.id || idx}
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-accent border border-border"
                                                    >
                                                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                            {isImage ? (
                                                                <ImageIcon size={20} className="text-primary" />
                                                            ) : (
                                                                <File size={20} className="text-primary" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={file.name}>
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {(file.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={`data:${file.mimeType};base64,${file.data}`}
                                                            download={file.name}
                                                            className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                            title={t('download')}
                                                        >
                                                            <Download size={18} />
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Lightbox */}
                            {images.length > 0 && (
                                <Lightbox
                                    open={isLightboxOpen}
                                    close={() => setIsLightboxOpen(false)}
                                    slides={images.map(src => ({ src }))}
                                    index={lightboxIndex}
                                    plugins={[Zoom]}
                                    zoom={{
                                        maxZoomPixelRatio: 3,
                                        scrollToZoom: true,
                                    }}
                                    carousel={{ finite: true }}
                                    controller={{ closeOnBackdropClick: true }}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    // Locked State
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="text-center space-y-6 max-w-md w-full">
                            {/* Lock Icon - Static */}
                            <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-accent border border-border">
                                <Lock size={32} className="text-warning" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    {t('contentEncrypted')}
                                </h3>
                                <p className="text-muted-foreground">{t('timeLockActive')}</p>
                            </div>

                            {/* Countdown Card */}
                            <div className="p-4 bg-accent rounded-xl border border-border">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                                    {t('unlocksIn')}
                                </div>
                                <div className="flex justify-center">
                                    <CountdownVisuals
                                        targetDate={item.decrypt_at}
                                        className="text-2xl"
                                        showIcon={false}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
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
