'use client';

import { FilterParams } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
    FileText, Image as ImageIcon, Lock, Unlock, X, Search,
    ChevronDown, RotateCcw, Calendar, Clock, Zap,
    Bookmark, Save, Trash2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/stores/settings-store';
import PresetSaveDialog from './PresetSaveDialog';

interface FilterPanelProps {
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
    const t = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Store hooks
    const { filterPresets, addFilterPreset, removeFilterPreset } = useSettings();

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
        onFilterChange({
            status: 'all',
            sort: filters.sort || 'created_desc',
            dateRange: undefined,
            quickFilter: undefined,
        });
    };

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const handleSavePreset = (name: string) => {
        const preset = {
            id: generateId(),
            name,
            filters: {
                status: filters.status,
                type: filters.type,
                search: filters.search,
                dateRange: filters.dateRange,
                quickFilter: filters.quickFilter,
                sort: filters.sort
            },
            createdAt: Date.now()
        };
        addFilterPreset(preset);
    };

    const handleLoadPreset = (presetId: string) => {
        const preset = filterPresets.find(p => p.id === presetId);
        if (preset) {
            setSearchInput(preset.filters.search || '');
            onFilterChange({
                limit: filters.limit,
                offset: filters.offset,
                ...preset.filters
            });
        }
    };

    const hasActiveFilters =
        filters.status !== 'all' ||
        !!filters.type ||
        !!filters.search ||
        !!filters.dateRange ||
        !!filters.quickFilter;

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
                            {/* Filter Presets Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <Bookmark size={12} className="inline mr-1" />
                                        {t('presets')}
                                    </label>
                                    <button
                                        onClick={() => setShowSaveDialog(true)}
                                        disabled={!hasActiveFilters}
                                        className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                        <Save size={12} />
                                        {t('savePreset')}
                                    </button>
                                </div>

                                {filterPresets.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {filterPresets.map(preset => (
                                            <div key={preset.id} className="group flex items-center gap-2 bg-muted/30 hover:bg-muted/50 rounded-lg p-2 transition-colors border border-transparent hover:border-border">
                                                <button
                                                    onClick={() => handleLoadPreset(preset.id)}
                                                    className="flex-1 text-left text-sm truncate font-medium text-muted-foreground group-hover:text-foreground"
                                                >
                                                    {preset.name}
                                                </button>
                                                <button
                                                    onClick={() => removeFilterPreset(preset.id)}
                                                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-background/50"
                                                    title={t('deletePreset')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground italic px-2">
                                        {t('noPresets')}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-border/50 mx-2" />

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

                            {/* Date Range Filter */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <Calendar size={12} className="inline mr-1" />
                                        {t('timeRange')}
                                    </label>
                                    {filters.dateRange && (
                                        <button
                                            onClick={() => onFilterChange({ ...filters, dateRange: undefined })}
                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                            title="Clear date range"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <button
                                        onClick={() => {
                                            const now = new Date();
                                            const start = new Date(now.setHours(0, 0, 0, 0)).getTime();
                                            const end = new Date(now.setHours(23, 59, 59, 999)).getTime();
                                            onFilterChange({ ...filters, dateRange: { start, end } });
                                        }}
                                        className={cn(
                                            "px-2 py-1.5 text-xs font-medium rounded-lg transition-all border border-transparent",
                                            filters.dateRange && Math.abs(filters.dateRange.end - filters.dateRange.start) < 86400000
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        {t('today')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const now = new Date();
                                            const end = now.getTime();
                                            const start = new Date(now.setDate(now.getDate() - 7)).getTime();
                                            onFilterChange({ ...filters, dateRange: { start, end } });
                                        }}
                                        className={cn(
                                            "px-2 py-1.5 text-xs font-medium rounded-lg transition-all border border-transparent",
                                            filters.dateRange && Math.abs(filters.dateRange.end - filters.dateRange.start) > 86400000 && Math.abs(filters.dateRange.end - filters.dateRange.start) < 604800000 * 1.1
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        {t('thisWeek')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const now = new Date();
                                            const end = now.getTime();
                                            const start = new Date(now.setDate(now.getDate() - 30)).getTime();
                                            onFilterChange({ ...filters, dateRange: { start, end } });
                                        }}
                                        className={cn(
                                            "px-2 py-1.5 text-xs font-medium rounded-lg transition-all border border-transparent",
                                            filters.dateRange && Math.abs(filters.dateRange.end - filters.dateRange.start) > 604800000 * 1.1
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        {t('thisMonth')}
                                    </button>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider pl-1">Start</label>
                                        <input
                                            type="date"
                                            className="w-full px-2 py-1.5 text-xs bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                            value={filters.dateRange?.start ? new Date(filters.dateRange.start).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value).getTime() : undefined;
                                                const currentEnd = filters.dateRange?.end;
                                                if (date) {
                                                    onFilterChange({
                                                        ...filters,
                                                        dateRange: {
                                                            start: date,
                                                            end: currentEnd || date + 86400000 // Default to 1 day if no end
                                                        }
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider pl-1">End</label>
                                        <input
                                            type="date"
                                            className="w-full px-2 py-1.5 text-xs bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                            value={filters.dateRange?.end ? new Date(filters.dateRange.end).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value).setHours(23, 59, 59, 999) : undefined;
                                                const currentStart = filters.dateRange?.start;
                                                if (date) {
                                                    onFilterChange({
                                                        ...filters,
                                                        dateRange: {
                                                            start: currentStart || date - 86400000, // Default to 1 day before if no start
                                                            end: date
                                                        }
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
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

                            {/* Quick Filters */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <Zap size={12} className="inline mr-1" />
                                    {t('quickFilters')}
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => onFilterChange({
                                            ...filters,
                                            quickFilter: filters.quickFilter === 'unlocking-soon' ? undefined : 'unlocking-soon'
                                        })}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                            filters.quickFilter === 'unlocking-soon'
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            <div className="text-left">
                                                <div className="font-medium">{t('unlockingSoon')}</div>
                                                <div className="text-xs opacity-70">{t('unlockingSoonDesc')}</div>
                                            </div>
                                        </div>
                                        {filters.quickFilter === 'unlocking-soon' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => onFilterChange({
                                            ...filters,
                                            quickFilter: filters.quickFilter === 'long-locked' ? undefined : 'long-locked'
                                        })}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                            filters.quickFilter === 'long-locked'
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} />
                                            <div className="text-left">
                                                <div className="font-medium">{t('longLocked')}</div>
                                                <div className="text-xs opacity-70">{t('longLockedDesc')}</div>
                                            </div>
                                        </div>
                                        {filters.quickFilter === 'long-locked' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => onFilterChange({
                                            ...filters,
                                            quickFilter: filters.quickFilter === 'recent' ? undefined : 'recent'
                                        })}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                            filters.quickFilter === 'recent'
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <div className="text-left">
                                                <div className="font-medium">{t('recentlyCreated')}</div>
                                                <div className="text-xs opacity-70">{t('recentlyCreatedDesc')}</div>
                                            </div>
                                        </div>
                                        {filters.quickFilter === 'recent' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Sort Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {t('sortBy')}
                                </label>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleSortChange('created_desc')}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                            (filters.sort || 'created_desc') === 'created_desc'
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <span>{t('sortCreatedDesc')}</span>
                                        {(filters.sort || 'created_desc') === 'created_desc' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleSortChange('created_asc')}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                            filters.sort === 'created_asc'
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <span>{t('sortCreatedAsc')}</span>
                                        {filters.sort === 'created_asc' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleSortChange('decrypt_desc')}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                            filters.sort === 'decrypt_desc'
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <span>{t('sortDecryptDesc')}</span>
                                        {filters.sort === 'decrypt_desc' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleSortChange('decrypt_asc')}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                            filters.sort === 'decrypt_asc'
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <span>{t('sortDecryptAsc')}</span>
                                        {filters.sort === 'decrypt_asc' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                    </button>
                                </div>
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

            {/* Preset Save Dialog */}
            <PresetSaveDialog
                isOpen={showSaveDialog}
                onClose={() => setShowSaveDialog(false)}
                onConfirm={handleSavePreset}
            />
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
