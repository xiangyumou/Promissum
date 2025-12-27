'use client';

import { FilterParams } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FileText, Image as ImageIcon, Lock, Unlock, X, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterPanelProps {
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
    const t = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');
    const [isOpen, setIsOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.search || '');

    const handleStatusChange = (status: FilterParams['status']) => {
        onFilterChange({ ...filters, status });
    };

    const handleTypeChange = (type: FilterParams['type']) => {
        onFilterChange({ ...filters, type });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);
        onFilterChange({ ...filters, search: value });
    };

    const clearSearch = () => {
        setSearchInput('');
        onFilterChange({ ...filters, search: '' });
    };

    const clearType = () => {
        onFilterChange({ ...filters, type: undefined });
    };

    const clearStatus = () => {
        onFilterChange({ ...filters, status: 'all' });
    };

    const resetAll = () => {
        setSearchInput('');
        onFilterChange({ status: 'all' });
    };

    const hasActiveFilters = filters.status !== 'all' || !!filters.type || !!filters.search;

    return (
        <>
            {/* Filter Trigger Button */}
            <div className="px-3 py-2">
                <button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        hasActiveFilters
                            ? "bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/20"
                            : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground border border-transparent"
                    )}
                    title={t('filters')}
                >
                    <SlidersHorizontal size={16} />
                    {t('filters')}
                    {hasActiveFilters && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-primary rounded-full"
                        />
                    )}
                </button>
            </div>

            {/* Filter Panel Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-x-4 top-20 md:left-[320px] md:right-auto md:w-[360px] z-[70] glass-card rounded-2xl p-6 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={20} className="text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">{t('filters')}</h3>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                    title="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <Search size={12} className="inline mr-1" />
                                        {t('search')}
                                    </label>
                                    {searchInput && (
                                        <button
                                            onClick={clearSearch}
                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                            title={t('clearSearch')}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={handleSearchChange}
                                        placeholder={t('searchPlaceholder')}
                                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder-muted-foreground transition-all"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <Lock size={12} className="inline mr-1" />
                                        Status
                                    </label>
                                    {filters.status !== 'all' && (
                                        <button
                                            onClick={clearStatus}
                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                            title={t('clearStatus')}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex bg-muted/30 p-1 rounded-xl border border-border gap-1">
                                    <FilterButton
                                        active={filters.status === 'all'}
                                        onClick={() => handleStatusChange('all')}
                                        label={t('all')}
                                        icon={null}
                                    />
                                    <FilterButton
                                        active={filters.status === 'locked'}
                                        onClick={() => handleStatusChange('locked')}
                                        icon={<Lock size={14} />}
                                        label={t('locked')}
                                    />
                                    <FilterButton
                                        active={filters.status === 'unlocked'}
                                        onClick={() => handleStatusChange('unlocked')}
                                        icon={<Unlock size={14} />}
                                        label={t('unlocked')}
                                    />
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <FileText size={12} className="inline mr-1" />
                                        Type
                                    </label>
                                    {filters.type && (
                                        <button
                                            onClick={clearType}
                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                            title={t('clearType')}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex bg-muted/30 p-1 rounded-xl border border-border gap-1">
                                    <FilterButton
                                        active={!filters.type}
                                        onClick={() => handleTypeChange(undefined)}
                                        label={t('all')}
                                        icon={null}
                                    />
                                    <FilterButton
                                        active={filters.type === 'text'}
                                        onClick={() => handleTypeChange('text')}
                                        icon={<FileText size={14} />}
                                        label={tCommon('textNote')}
                                    />
                                    <FilterButton
                                        active={filters.type === 'image'}
                                        onClick={() => handleTypeChange('image')}
                                        icon={<ImageIcon size={14} />}
                                        label={tCommon('image')}
                                    />
                                </div>
                            </div>

                            {/* Reset All Button */}
                            {hasActiveFilters && (
                                <motion.button
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border hover:border-primary/30"
                                    onClick={resetAll}
                                    title={t('resetFilters')}
                                >
                                    <RotateCcw size={14} />
                                    {t('resetFilters')}
                                </motion.button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

function FilterButton({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all",
                active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            onClick={onClick}
        >
            {icon}
            <span className="truncate">{label}</span>
        </button>
    );
}
