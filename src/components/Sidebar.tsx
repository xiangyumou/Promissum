'use client';

import React, { useMemo } from 'react';
import { ApiItemListView } from '@/lib/types';
import { FilterParams } from '@/lib/api-client';
import FilterBar from './FilterBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, Image as ImageIcon, Lock, Unlock, Settings, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/Skeleton';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useSettings } from '@/lib/stores/settings-store';
import { useHasMounted } from '@/hooks/useHasMounted';
import { timeService } from '@/lib/services/time-service';
import { useMediaQuery } from '@/hooks/useMediaQuery';


interface SidebarProps {
    items: ApiItemListView[];
    selectedId: string | null;
    onSelectItem: (id: string) => void;
    onAddClick: () => void;
    isOpen: boolean;
    onClose: () => void;
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
    isLoading?: boolean;
}

export default function Sidebar({
    items,
    selectedId,
    onSelectItem,
    onAddClick,
    isOpen,
    onClose,
    filters,
    onFilterChange,
    isLoading = false
}: SidebarProps) {
    const t = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');
    const { compactMode, sidebarOpen, setSidebarOpen } = useSettings();
    const hasMounted = useHasMounted();

    // Sidebar motion variants
    const sidebarVariants = {
        mobileClosed: {
            x: "-100%",
            transition: { type: "spring", stiffness: 300, damping: 30 } as const
        },
        mobileOpen: {
            x: 0,
            transition: { type: "spring", stiffness: 300, damping: 30 } as const
        },
        desktopClosed: {
            width: 0,
            transition: { type: "spring", stiffness: 300, damping: 30 } as const
        },
        desktopOpen: {
            width: "var(--sidebar-width, 320px)",
            transition: { type: "spring", stiffness: 300, damping: 30 } as const
        }
    };

    const contentVariants = {
        closed: { opacity: 0, transition: { duration: 0.2 } },
        open: { opacity: 1, transition: { duration: 0.2, delay: 0.1 } }
    };

    const overlayVariants = {
        closed: { opacity: 0, pointerEvents: "none" as const },
        open: { opacity: 1, pointerEvents: "auto" as const }
    };

    // Media query to detect desktop
    const isDesktop = useMediaQuery("(min-width: 768px)", true);

    // Determine animation state
    const animateState = isDesktop
        ? (sidebarOpen ? "desktopOpen" : "desktopClosed")
        : (isOpen ? "mobileOpen" : "mobileClosed");

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && !isDesktop && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={overlayVariants}
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.div
                className={cn(
                    "fixed md:relative h-full z-50 md:z-30 bg-background/80 backdrop-blur-xl border-r border-border flex flex-col",
                    "hover:shadow-xl transition-shadow duration-300 shadow-2xl md:shadow-none"
                )}
                suppressHydrationWarning
                initial={false}
                animate={animateState}
                variants={sidebarVariants}
            >
                {/* Desktop Edge Toggle Button */}
                {hasMounted && isDesktop && (
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={cn(
                            "absolute md:flex hidden items-center justify-center",
                            "right-[-12px] top-6 w-6 h-6 rounded-full",
                            "bg-background border border-border shadow-md text-muted-foreground hover:text-foreground hover:bg-accent",
                            "transition-all duration-200 z-50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                            !sidebarOpen && "right-[-32px] w-8 h-8 opacity-50 hover:opacity-100"
                        )}
                        title={sidebarOpen ? t('collapseSidebar') : tCommon('open')}
                    >
                        <PanelLeftClose
                            size={14}
                            className={cn(
                                "transition-transform duration-300",
                                !sidebarOpen && "rotate-180"
                            )}
                        />
                    </button>
                )}

                {/* Inner Content Wrapper for Opacity Animation */}
                <motion.div
                    className="flex-1 flex flex-col overflow-hidden w-[var(--sidebar-width,320px)]"
                    animate={(hasMounted && (sidebarOpen || !isDesktop)) ? "open" : "closed"}
                    variants={contentVariants}
                >
                    {hasMounted && (
                        <SidebarContent
                            items={items}
                            selectedId={selectedId}
                            onSelectItem={onSelectItem}
                            onAddClick={onAddClick}
                            onClose={onClose}
                            filters={filters}
                            onFilterChange={onFilterChange}
                            isLoading={isLoading}
                            compactMode={compactMode}
                            setSidebarOpen={setSidebarOpen}
                        />
                    )}
                </motion.div>
            </motion.div>
        </>
    );
}


interface SidebarContentProps {
    items: ApiItemListView[];
    selectedId: string | null;
    onSelectItem: (id: string) => void;
    onAddClick: () => void;
    onClose: () => void;
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
    isLoading: boolean;
    compactMode: boolean;
    setSidebarOpen: (open: boolean) => void;
}

function SidebarContent({
    items,
    selectedId,
    onSelectItem,
    onAddClick,
    onClose,
    filters,
    onFilterChange,
    isLoading,
    compactMode,
    setSidebarOpen
}: SidebarContentProps) {
    const t = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');

    return (
        <>
            {/* Mobile Close Button */}
            <button
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 text-muted-foreground md:hidden transition-colors z-20"
                onClick={onClose}
                aria-label="Close menu"
            >
                <X size={20} />
            </button>

            {/* Primary Actions Group */}
            <div className={cn("space-y-3", compactMode ? "p-3 pb-1" : "p-4 pb-2")}>
                <button
                    className={cn(
                        "premium-button w-full",
                        compactMode ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
                    )}
                    onClick={onAddClick}
                >
                    <Plus size={compactMode ? 16 : 18} />
                    {tCommon('newEntry')}
                </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4 my-2" />

            {/* Filter Bar - Simple search and status/type filters */}
            <FilterBar filters={filters} onFilterChange={onFilterChange} />

            {/* Items List */}
            <div className={cn("flex-1 overflow-y-auto space-y-1.5 custom-scrollbar", compactMode ? "px-2 py-1" : "px-3 py-2")}>
                {
                    isLoading ? (
                        // Loading Skeletons
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={cn("flex items-center gap-3 rounded-xl bg-accent/50 animate-pulse", compactMode ? "p-2" : "p-3")}>
                                <div className={cn("rounded-full bg-accent", compactMode ? "h-6 w-6" : "h-8 w-8")} />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-3/4 bg-accent rounded" />
                                    <div className="h-2 w-1/2 bg-accent/50 rounded" />
                                </div>
                            </div>
                        ))
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <div className="p-4 rounded-full bg-accent mb-3">
                                <Lock size={24} className="opacity-40" />
                            </div>
                            <p className="text-sm">{t('noItems')}</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false} mode="popLayout">
                            {items.map((item) => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    isSelected={item.id === selectedId}
                                    onClick={() => onSelectItem(item.id)}
                                    compactMode={compactMode}
                                />
                            ))}
                        </AnimatePresence>
                    )
                }
            </div>

            {/* Footer - Settings Button */}
            <div className={cn("border-t border-border", compactMode ? "p-2" : "p-4")}>
                <Link href="/settings">
                    <button className={cn(
                        "w-full flex items-center gap-3 rounded-xl font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                        compactMode ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
                    )}>
                        <Settings size={compactMode ? 16 : 18} />
                        {t('settings')}
                    </button>
                </Link>
            </div>
        </>
    );
}


interface ItemCardProps {
    item: ApiItemListView;
    isSelected: boolean;
    onClick: () => void;
    compactMode?: boolean;
}

function ItemCard({
    item,
    isSelected,
    onClick,
    compactMode = false
}: ItemCardProps) {
    const hasMounted = useHasMounted();

    const isUnlocked = hasMounted ? timeService.now() >= item.decrypt_at : false;
    const timeRemaining = hasMounted ? getTimeRemaining(item.decrypt_at) : '...';
    const tCommon = useTranslations('Common');
    const { privacyMode } = useSettings();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-300 group relative border",
                compactMode ? "px-2 py-2" : "px-3 py-3",
                isSelected
                    ? "bg-accent border-primary/50 shadow-md shadow-primary/10"
                    : "border-transparent hover:bg-accent/50 hover:border-border/50 hover:-translate-y-0.5"
            )}
            onClick={onClick}
        >
            <div className={cn(
                "flex items-center justify-center rounded-lg shadow-sm text-sm transition-transform group-hover:scale-105",
                compactMode ? "w-7 h-7" : "w-9 h-9",
                item.type === 'text'
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                privacyMode && !isSelected && "blur-sm grayscale opacity-50 group-hover:blur-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            )}>
                {item.type === 'text' ? <FileText size={compactMode ? 14 : 16} /> : <ImageIcon size={compactMode ? 14 : 16} />}
            </div>

            <div className="flex-1 min-w-0">
                <div className={cn(
                    "text-sm font-medium truncate transition-all duration-300",
                    isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                    privacyMode && !isSelected && "blur-sm group-hover:blur-0"
                )}>
                    {item.metadata?.title ||
                        (item.type === 'text' ? tCommon('textNote') : tCommon('image'))}
                </div>
                <div className={cn(
                    "text-xs flex items-center gap-1.5 mt-1 font-medium truncate",
                    isUnlocked ? "text-emerald-500" : "text-muted-foreground"
                )}>
                    {isUnlocked ? (
                        <><Unlock size={10} /> {tCommon('unlocked')}</>
                    ) : (
                        <><Lock size={10} /> {timeRemaining}</>
                    )}
                </div>
            </div>

            {isSelected && (
                <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_var(--primary)]"
                />
            )}
        </motion.div>
    );
}

function getTimeRemaining(decryptAt: number): string {
    const now = timeService.now();
    const diff = decryptAt - now;

    if (diff <= 0) return 'Unlocked';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
