'use client';

import { ApiItemListView } from '@/lib/types';
import { FilterParams } from '@/lib/queries';
import FilterBar from './FilterBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, Image as ImageIcon, Lock, Unlock, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslations } from 'next-intl';

import { useSettings } from '@/lib/stores/settings-store';
import { useHasMounted } from '@/hooks/useHasMounted';
import { timeService } from '@/lib/services/time-service';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getRelativeTimeRemaining } from '@/lib/utils/unlock-time';


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
    const { sidebarOpen, setSidebarOpen } = useSettings();
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
}

function SidebarContent({
    items,
    selectedId,
    onSelectItem,
    onAddClick,
    onClose,
    filters,
    onFilterChange,
    isLoading
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
            <div className="space-y-3 p-4 pb-2">
                <button
                    className="premium-button w-full px-4 py-3 text-sm"
                    onClick={onAddClick}
                >
                    <Plus size={18} />
                    {tCommon('newEntry')}
                </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4 my-2" />

            {/* Filter Bar - Simple search and status/type filters */}
            <FilterBar filters={filters} onFilterChange={onFilterChange} />

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar px-3 py-2">
                {
                    isLoading ? (
                        // Loading Skeletons
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl bg-accent/50 animate-pulse p-3">
                                <div className="rounded-full bg-accent h-8 w-8" />
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
                                />
                            ))}
                        </AnimatePresence>
                    )
                }
            </div>


        </>
    );
}


interface ItemCardProps {
    item: ApiItemListView;
    isSelected: boolean;
    onClick: () => void;
}

function ItemCard({
    item,
    isSelected,
    onClick
}: ItemCardProps) {
    const hasMounted = useHasMounted();

    const isUnlocked = hasMounted ? timeService.now() >= item.decrypt_at : false;
    const timeRemaining = hasMounted ? getRelativeTimeRemaining(item.decrypt_at) : '...';
    const tCommon = useTranslations('Common');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-300 group relative border px-3 py-3",
                isSelected
                    ? "bg-accent border-primary/50 shadow-md shadow-primary/10"
                    : "border-transparent hover:bg-accent/50 hover:border-border/50 hover:-translate-y-0.5"
            )}
            onClick={onClick}
        >
            <div className={cn(
                "flex items-center justify-center rounded-lg shadow-sm text-sm transition-transform group-hover:scale-105 w-9 h-9",
                item.type === 'text'
                    ? "bg-type-text/10 text-type-text border border-type-text/20"
                    : "bg-type-image/10 text-type-image border border-type-image/20"
            )}>
                {item.type === 'text' ? <FileText size={16} /> : <ImageIcon size={16} />}
            </div>

            <div className="flex-1 min-w-0">
                <div
                    className={cn(
                        "text-sm font-medium truncate transition-all duration-300",
                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                >
                    {item.metadata?.title ||
                        (item.type === 'text' ? tCommon('textNote') : tCommon('image'))}
                </div>
                <div className={cn(
                    "text-xs flex items-center gap-1.5 mt-1 font-medium truncate",
                    isUnlocked ? "text-success" : "text-muted-foreground"
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
