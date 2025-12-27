'use client';

import { FilterParams } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FileText, Image as ImageIcon, Lock, Unlock, X, Search, ChevronDown, RotateCcw } from 'lucide-react';
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.search || '');

    const handleStatusChange = (status: FilterParams['status']) => {
        onFilterChange({ ...filters, status });
    };

    const handleTypeChange = (type: FilterParams['type']) => {
        onFilterChange({ ...filters, type });
    };

    const handleSortChange = (sort: FilterParams['sort']) => {
        onFilterChange({ ...filters, sort });
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
        onFilterChange({ status: 'all', sort: filters.sort || 'created_desc' });
    };

    const hasActiveFilters = filters.status !== 'all' || !!filters.type || !!filters.search;

    return (
        <div className="px-3 py-2">
            {/* Filter Trigger Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    hasActiveFilters
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/20"
                        : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground border border-transparent"
                )}
                title={t('filters')}
            >
                <div className="flex items-center gap-2">
                    <Search size={16} />
                    <span>{t('filters')}</span>
                    {hasActiveFilters && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-primary rounded-full"
                        />
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={16} />
                </motion.div>
            </button>

            {/* Accordion Content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3 space-y-4">
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
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder-muted-foreground transition-all"
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

                            {/* Sort Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    排序方式
                                </label>
                                <select
                                    value={filters.sort || 'created_desc'}
                                    onChange={(e) => handleSortChange(e.target.value as any)}
                                    className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
                                >
                                    <option value="created_desc">创建时间 (新→旧)</option>
                                    <option value="created_asc">创建时间 (旧→新)</option>
                                    <option value="decrypt_desc">解锁时间 (晚→早)</option>
                                    <option value="decrypt_asc">解锁时间 (早→晚)</option>
                                </select>
                            </div>

                            {/* Reset All Button */}
                            {hasActiveFilters && (
                                <motion.button
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border hover:border-primary/30"
                                    onClick={resetAll}
                                    title={t('resetFilters')}
                                >
                                    <RotateCcw size={14} />
                                    {t('resetFilters')}
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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
