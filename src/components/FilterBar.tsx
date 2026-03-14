'use client';

import { FilterParams } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Lock, Unlock, X } from 'lucide-react';

interface FilterBarProps {
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const handleStatusChange = (status: FilterParams['status']) => {
        onFilterChange({ ...filters, status });
    };

    const hasActiveFilters = filters.status !== 'all';

    return (
        <div className="px-3 py-2 space-y-4 mb-2">
            {/* Status Filter */}
            <div className="space-y-2">
                <div className="flex bg-card p-1 rounded-lg border border-border">
                    <FilterButton
                        active={filters.status === 'all'}
                        onClick={() => handleStatusChange('all')}
                        label="全部"
                    />
                    <FilterButton
                        active={filters.status === 'locked'}
                        onClick={() => handleStatusChange('locked')}
                        icon={<Lock size={12} />}
                        label="锁定中"
                    />
                    <FilterButton
                        active={filters.status === 'unlocked'}
                        onClick={() => handleStatusChange('unlocked')}
                        icon={<Unlock size={12} />}
                        label="已解锁"
                    />
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <button
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border border-dashed hover:border-solid"
                    onClick={() => {
                        onFilterChange({ status: 'all' });
                    }}
                >
                    <X size={12} />
                    清除筛选
                </button>
            )}
        </div>
    );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon?: React.ReactNode, label: string }) {
    return (
        <button
            className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                active
                    ? "bg-surface2 text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            onClick={onClick}
        >
            {icon}
            {label}
        </button>
    )
}
