'use client';

import { FilterParams } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Lock, Unlock, X, Search } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const [searchInput, setSearchInput] = useState(filters.search || '');

    const handleStatusChange = (status: FilterParams['status']) => {
        onFilterChange({ ...filters, status });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);
        onFilterChange({ ...filters, search: value });
    };

    const hasActiveFilters = filters.status !== 'all' || !!filters.search;

    return (
        <div className="px-3 py-2 space-y-4 mb-2">
            {/* Search Input */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder="搜索..."
                    className="input pl-9 pr-8 text-xs"
                />
                {searchInput && (
                    <button
                        onClick={() => {
                            setSearchInput('');
                            onFilterChange({ ...filters, search: '' });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider pl-1">
                    状态
                </div>
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
                        setSearchInput('');
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
