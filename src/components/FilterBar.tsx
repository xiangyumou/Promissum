'use client';

import { FilterParams } from '@/lib/api-client';

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

    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label htmlFor="status-filter" className="filter-label">
                    状态
                </label>
                <select
                    id="status-filter"
                    className="filter-select"
                    value={filters.status || 'all'}
                    onChange={(e) => handleStatusChange(e.target.value as FilterParams['status'])}
                >
                    <option value="all">全部</option>
                    <option value="locked">🔒 锁定中</option>
                    <option value="unlocked">✅ 已解锁</option>
                </select>
            </div>

            <div className="filter-group">
                <label htmlFor="type-filter" className="filter-label">
                    类型
                </label>
                <select
                    id="type-filter"
                    className="filter-select"
                    value={filters.type || ''}
                    onChange={(e) => handleTypeChange(e.target.value as FilterParams['type'] || undefined)}
                >
                    <option value="">全部类型</option>
                    <option value="text">📝 文本</option>
                    <option value="image">🖼️ 图片</option>
                </select>
            </div>

            {(filters.status !== 'all' || filters.type) && (
                <button
                    className="filter-reset"
                    onClick={() => onFilterChange({ status: 'all' })}
                    title="重置筛选"
                >
                    ✕ 重置
                </button>
            )}
        </div>
    );
}
