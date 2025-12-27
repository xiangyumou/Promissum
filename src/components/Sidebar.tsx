'use client';

import { ItemListView } from '@/lib/types';
import { FilterParams } from '@/lib/api-client';
import FilterPanel from './FilterPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, Image as ImageIcon, Lock, Unlock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/Skeleton';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface SidebarProps {
    items: ItemListView[];
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

    // Sidebar motion variants
    const sidebarVariants = {
        closed: {
            x: "-100%",
            opacity: 0,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 30
            }
        },
        open: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 30
            }
        }
    };

    const overlayVariants = {
        closed: { opacity: 0, pointerEvents: "none" as const },
        open: { opacity: 1, pointerEvents: "auto" as const }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
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
                    "fixed sidebar h-full z-50 shadow-2xl md:shadow-none border-r border-border",
                    "md:relative md:!transform-none md:!opacity-100" // Reset for desktop
                )}
                initial={false}
                animate={isOpen ? "open" : "closed"}
                variants={sidebarVariants}
            >
                {/* Mobile Close Button */}
                <button
                    className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 text-muted-foreground md:hidden transition-colors"
                    onClick={onClose}
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>

                {/* Primary Actions Group */}
                <div className="p-4 pb-2 space-y-3">
                    {/* Add Button - Premium Gradient */}
                    <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm font-semibold tracking-wide"
                        onClick={onAddClick}
                    >
                        <Plus size={18} />
                        {tCommon('newEntry')}
                    </button>
                </div>

                {/* Divider - Subtle */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4 my-2" />

                {/* Filter Panel */}
                <FilterPanel filters={filters} onFilterChange={onFilterChange} />

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
                    {isLoading ? (
                        // Loading Skeletons
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 animate-pulse">
                                <div className="h-8 w-8 rounded-full bg-accent" />
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
                    )}
                </div>

                {/* Footer - Settings Button */}
                <div className="p-4 border-t border-border">
                    <Link href="/settings">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200">
                            <Settings size={18} />
                            {t('settings')}
                        </button>
                    </Link>
                </div>

            </motion.div>
        </>
    );
}

interface ItemCardProps {
    item: ItemListView;
    isSelected: boolean;
    onClick: () => void;
}

function ItemCard({ item, isSelected, onClick }: ItemCardProps) {
    const isUnlocked = Date.now() >= item.decrypt_at;
    const timeRemaining = getTimeRemaining(item.decrypt_at);
    const tCommon = useTranslations('Common');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative border",
                isSelected
                    ? "bg-accent border-border shadow-sm"
                    : "border-transparent hover:bg-accent/50 hover:border-border/50"
            )}
            onClick={onClick}
        >
            <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg shadow-sm text-sm transition-transform group-hover:scale-105",
                item.type === 'text'
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
            )}>
                {item.type === 'text' ? <FileText size={16} /> : <ImageIcon size={16} />}
            </div>

            <div className="flex-1 min-w-0">
                <div className={cn(
                    "text-sm font-medium truncate transition-colors",
                    isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>
                    {item.metadata?.title ||
                        (item.type === 'text' ? tCommon('textNote') : (item.original_name || tCommon('image')))}
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
    const now = Date.now();
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
