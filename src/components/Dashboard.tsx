'use client';

import { useStats } from '@/lib/queries';

export default function Dashboard() {
    const { data: stats, isLoading, error } = useStats();

    if (isLoading) {
        return (
            <div className="dashboard-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-error">
                    Failed to load statistics
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">📊 统计概览</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-value">{stats.totalItems}</div>
                    <div className="stat-label">总项目数</div>
                </div>

                <div className="stat-card stat-locked">
                    <div className="stat-icon">🔒</div>
                    <div className="stat-value">{stats.lockedItems}</div>
                    <div className="stat-label">锁定中</div>
                </div>

                <div className="stat-card stat-unlocked">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.unlockedItems}</div>
                    <div className="stat-label">已解锁</div>
                </div>
            </div>

            <div className="stats-grid stats-grid-two">
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{stats.byType.text}</div>
                    <div className="stat-label">文本</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🖼️</div>
                    <div className="stat-value">{stats.byType.image}</div>
                    <div className="stat-label">图片</div>
                </div>
            </div>

            {stats.avgLockDurationMinutes !== undefined && (
                <div className="stat-card stat-avg">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">
                        {Math.round(stats.avgLockDurationMinutes / 60)}h
                    </div>
                    <div className="stat-label">平均锁定时长</div>
                </div>
            )}
        </div>
    );
}
