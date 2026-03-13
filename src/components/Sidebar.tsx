'use client';

import { useState, useEffect } from 'react';
import { Item, FilterParams } from '@/lib/types';
import { isUnlocked as checkUnlocked, getItemDisplayTitle } from '@/core/time';
import FilterBar from './FilterBar';
import { Plus, X, FileText, Image as ImageIcon, Lock, Unlock, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getRelativeTimeRemaining } from '@/core/time';

const STORAGE_KEY = 'promissum-sidebar-open';

interface SidebarProps {
    items: Item[];
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
    const hasMounted = useHasMounted();
    const isDesktop = useMediaQuery("(min-width: 768px)", true);

    // Desktop sidebar state with localStorage persistence
    const [desktopOpen, setDesktopOpen] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            setDesktopOpen(saved === 'true');
        }
    }, []);

    const setSidebarOpen = (open: boolean) => {
        setDesktopOpen(open);
        localStorage.setItem(STORAGE_KEY, String(open));
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && !isDesktop && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Desktop Toggle Button - Outside sidebar container */}
            {hasMounted && isDesktop && !desktopOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed left-4 top-6 z-50 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground transition-colors duration-150"
                    title={tCommon('open')}
                >
                    <PanelLeftClose size={14} className="rotate-180" />
                </button>
            )}

            {/* Sidebar Container */}
            <div
                className={cn(
                    "fixed md:relative h-full z-50 md:z-30 bg-[var(--surface2)] border-r border-border flex flex-col",
                    "transition-all duration-200 ease-out",
                    isDesktop
                        ? (desktopOpen ? "w-[280px]" : "w-0 overflow-hidden")
                        : (isOpen ? "w-[280px] translate-x-0" : "w-[280px] -translate-x-full")
                )}
            >
                {/* Desktop Edge Toggle Button - Collapse only */}
                {hasMounted && isDesktop && desktopOpen && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute md:flex hidden items-center justify-center right-[-12px] top-6 w-6 h-6 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground transition-colors duration-150 z-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        title={t('collapseSidebar')}
                    >
                        <PanelLeftClose size={14} />
                    </button>
                )}

                {/* Inner Content */}
                <div className="flex-1 flex flex-col overflow-hidden w-[280px]">
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
                </div>
            </div>
        </>
    );
}

interface SidebarContentProps {
    items: Item[];
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
                className="absolute top-3 right-3 p-2 rounded-lg hover:bg-[var(--surface)] text-muted-foreground md:hidden transition-colors z-20"
                onClick={onClose}
                aria-label="Close menu"
            >
                <X size={20} />
            </button>

            {/* Primary Actions Group */}
            <div className="p-4 pb-2">
                <button
                    className="btn btn-primary w-full"
                    onClick={onAddClick}
                >
                    <Plus size={18} />
                    {tCommon('newEntry')}
                </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mx-4 my-2" />

            {/* Filter Bar */}
            <FilterBar filters={filters} onFilterChange={onFilterChange} />

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {isLoading ? (
                    // Loading Skeletons
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg bg-[var(--surface)] animate-pulse p-3">
                            <div className="rounded-full bg-border h-8 w-8" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-3/4 bg-border rounded" />
                                <div className="h-2 w-1/2 bg-border rounded opacity-50" />
                            </div>
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="p-4 rounded-full bg-[var(--surface)] mb-3">
                            <Lock size={24} className="opacity-40" />
                        </div>
                        <p className="text-sm">{t('noItems')}</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            isSelected={item.id === selectedId}
                            onClick={() => onSelectItem(item.id)}
                        />
                    ))
                )}
            </div>
        </>
    );
}

interface ItemCardProps {
    item: Item;
    isSelected: boolean;
    onClick: () => void;
}

function ItemCard({
    item,
    isSelected,
    onClick
}: ItemCardProps) {
    const hasMounted = useHasMounted();
    const isUnlocked = hasMounted ? checkUnlocked(item.decrypt_at) : false;
    const timeRemaining = hasMounted ? getRelativeTimeRemaining(item.decrypt_at) : '...';
    const tCommon = useTranslations('Common');

    return (
        <div
            className={cn(
                "sidebar-item",
                isSelected && "active"
            )}
            onClick={onClick}
        >
            {/* Type Icon - Monochrome style */}
            <div className={cn(
                "flex items-center justify-center rounded-md w-9 h-9 shrink-0",
                "bg-[var(--surface)] border border-border text-muted-foreground"
            )}>
                {item.type === 'text' ? <FileText size={16} /> : <ImageIcon size={16} />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                    {getItemDisplayTitle(item, tCommon)}
                </div>
                <div className={cn(
                    "text-xs flex items-center gap-1.5 mt-0.5 font-medium truncate",
                    isUnlocked ? "text-[var(--primary)]" : "text-muted-foreground"
                )}>
                    {isUnlocked ? (
                        <><Unlock size={10} /> {tCommon('unlocked')}</>
                    ) : (
                        <><Lock size={10} /> {timeRemaining}</>
                    )}
                </div>
            </div>
        </div>
    );
}
