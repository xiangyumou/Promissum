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

    const hasActiveFilters = filters.status !== 'all' || !!filters.type;

    return (
        <div className="filter-bar">
            {/* Status Filter - using toggle button pattern from AddModal */}
            <div className="filter-section">
                <div className="filter-section-label">状态</div>
                <div className="type-toggle">
                    <button
                        className={`toggle-btn ${filters.status === 'all' ? 'active' : ''}`}
                        onClick={() => handleStatusChange('all')}
                    >
                        全部
                    </button>
                    <button
                        className={`toggle-btn ${filters.status === 'locked' ? 'active' : ''}`}
                        onClick={() => handleStatusChange('locked')}
                    >
                        🔒 锁定
                    </button>
                    <button
                        className={`toggle-btn ${filters.status === 'unlocked' ? 'active' : ''}`}
                        onClick={() => handleStatusChange('unlocked')}
                    >
                        ✅ 解锁
                    </button>
                </div>
            </div>

            {/* Type Filter - using toggle button pattern from AddModal */}
            <div className="filter-section">
                <div className="filter-section-label">类型</div>
                <div className="type-toggle">
                    <button
                        className={`toggle-btn ${!filters.type ? 'active' : ''}`}
                        onClick={() => handleTypeChange(undefined)}
                    >
                        全部
                    </button>
                    <button
                        className={`toggle-btn ${filters.type === 'text' ? 'active' : ''}`}
                        onClick={() => handleTypeChange('text')}
                    >
                        📝 文本
                    </button>
                    <button
                        className={`toggle-btn ${filters.type === 'image' ? 'active' : ''}`}
                        onClick={() => handleTypeChange('image')}
                    >
                        🖼️ 图片
                    </button>
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <button
                    className="reset-btn"
                    onClick={() => onFilterChange({ status: 'all' })}
                    title="重置筛选"
                >
                    ✕ 重置
                </button>
            )}
        </div>
    );
}
