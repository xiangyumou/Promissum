'use client';

import { FilterParams } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FileText, Image as ImageIcon, Lock, Unlock, X } from 'lucide-react';

interface FilterBarProps {
    filters: FilterParams;
    onFilterChange: (filters: FilterParams) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
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
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1 font-mono">Status</div>
                <div className="flex bg-black/20 p-1 rounded-xl">
                    <FilterButton
                        active={filters.status === 'all'}
                        onClick={() => handleStatusChange('all')}
                        label="All"
                    />
                    <FilterButton
                        active={filters.status === 'locked'}
                        onClick={() => handleStatusChange('locked')}
                        icon={<Lock size={12} />}
                        label="Locked"
                    />
                    <FilterButton
                        active={filters.status === 'unlocked'}
                        onClick={() => handleStatusChange('unlocked')}
                        icon={<Unlock size={12} />}
                        label="Open"
                    />
                </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1 font-mono">Type</div>
                <div className="flex bg-black/20 p-1 rounded-xl">
                    <FilterButton
                        active={!filters.type}
                        onClick={() => handleTypeChange(undefined)}
                        label="All"
                    />
                    <FilterButton
                        active={filters.type === 'text'}
                        onClick={() => handleTypeChange('text')}
                        icon={<FileText size={12} />}
                        label="Text"
                    />
                    <FilterButton
                        active={filters.type === 'image'}
                        onClick={() => handleTypeChange('image')}
                        icon={<ImageIcon size={12} />}
                        label="Image"
                    />
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <button
                    className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
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
                    ? "bg-white/10 text-white shadow-sm border border-white/5"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
            onClick={onClick}
        >
            {icon}
            {label}
        </button>
    )
}
