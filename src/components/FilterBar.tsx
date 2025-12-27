'use client';

import { FilterParams } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FileText, Image as ImageIcon, Lock, Unlock, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FilterBarProps {
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const t = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');

    const handleStatusChange = (status: FilterParams['status']) => {
        onFilterChange({ ...filters, status });
    };

    const handleTypeChange = (type: FilterParams['type']) => {
        onFilterChange({ ...filters, type });
    };

    const hasActiveFilters = filters.status !== 'all' || !!filters.type;

    return (
        <div className="px-3 py-2 space-y-4 mb-2">
            {/* Status Filter */}
            <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1 font-mono">Status</div>
                <div className="flex bg-card/50 p-1 rounded-xl border border-border">
                    <FilterButton
                        active={filters.status === 'all'}
                        onClick={() => handleStatusChange('all')}
                        label={t('all')}
                    />
                    <FilterButton
                        active={filters.status === 'locked'}
                        onClick={() => handleStatusChange('locked')}
                        icon={<Lock size={12} />}
                        label={t('locked')}
                    />
                    <FilterButton
                        active={filters.status === 'unlocked'}
                        onClick={() => handleStatusChange('unlocked')}
                        icon={<Unlock size={12} />}
                        label={t('unlocked')}
                    />
                </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pl-1 font-mono">Type</div>
                <div className="flex bg-card/50 p-1 rounded-xl border border-border">
                    <FilterButton
                        active={!filters.type}
                        onClick={() => handleTypeChange(undefined)}
                        label={t('all')}
                    />
                    <FilterButton
                        active={filters.type === 'text'}
                        onClick={() => handleTypeChange('text')}
                        icon={<FileText size={12} />}
                        label={tCommon('textNote')}
                    />
                    <FilterButton
                        active={filters.type === 'image'}
                        onClick={() => handleTypeChange('image')}
                        icon={<ImageIcon size={12} />}
                        label={tCommon('image')}
                    />
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <button
                    className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-transparent hover:border-border"
                    onClick={() => onFilterChange({ status: 'all' })}
                    title="Reset Filters"
                >
                    <X size={12} />
                    Clear Filters
                </button>
            )}
        </div>
    );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon?: React.ReactNode, label: string }) {
    return (
        <button
            className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all",
                active
                    ? "bg-accent text-accent-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            onClick={onClick}
        >
            {icon}
            {label}
        </button>
    )
}
