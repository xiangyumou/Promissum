'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Dashboard from './Dashboard';
import { useItem, useDeleteItem, useExtendItem } from '@/lib/queries';
import { useCountdown } from '@/lib/use-countdown';

interface ContentViewProps {
    selectedId: string | null;
    onDelete: (id: string) => void;
    onMenuClick: () => void;
}

export default function ContentView({ selectedId, onDelete, onMenuClick }: ContentViewProps) {
    const [extendingMinutes, setExtendingMinutes] = useState<number | null>(null);

    // Fetch item with automatic refetching
    const { data: item, isLoading: loading } = useItem(selectedId);

    // Delete mutation
    const deleteMutation = useDeleteItem();

    // Extend mutation
    const extendMutation = useExtendItem(selectedId || '');

    // Countdown timer
    const countdown = useCountdown(item?.decryptAt || null, item?.unlocked || false);

    const handleDelete = async () => {
        if (!item || deleteMutation.isPending) return;

        toast.promise(
            deleteMutation.mutateAsync(item.id),
            {
                loading: 'Deleting...',
                success: () => {
                    onDelete(item.id);
                    return 'Item deleted successfully';
                },
                error: 'Failed to delete item',
            }
        );
    };

    const handleExtend = async (minutes: number) => {
        if (!item || extendingMinutes !== null) return;

        setExtendingMinutes(minutes);

        try {
            await toast.promise(
                extendMutation.mutateAsync(minutes),
                {
                    loading: 'Extending lock...',
                    success: `Extended by ${minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}`,
                    error: (err) => {
                        if (err instanceof Error && err.message.includes('conflict')) {
                            return '操作冲突，数据已刷新，请重试';
                        }
                        return 'Failed to extend lock';
                    },
                }
            );
        } finally {
            setExtendingMinutes(null);
        }
    };

    // Mobile menu button component
    const MobileMenuButton = () => (
        <button
            className="mobile-menu-btn"
            onClick={onMenuClick}
            aria-label="Open menu"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>
    );

    // Extend buttons component
    const ExtendButtons = () => (
        <div className="extend-buttons" style={{ marginTop: item?.unlocked ? '24px' : undefined }}>
            <span className="extend-label">Extend:</span>
            {[1, 10, 60, 360, 1440].map((mins) => (
                <button
                    key={mins}
                    className="extend-btn"
                    onClick={() => handleExtend(mins)}
                    disabled={extendingMinutes !== null}
                >
                    {extendingMinutes === mins ? '...' : `+${mins >= 60 ? `${mins / 60}h` : `${mins}m`}`}
                </button>
            ))}
        </div>
    );

    if (!selectedId) {
        return (
            <div className="content-view" style={{ display: 'block' }}>
                <div className="content-header" style={{ borderBottom: 'none' }}>
                    <MobileMenuButton />
                </div>
                <Dashboard />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="content-view loading">
                <div className="content-header" style={{ borderBottom: 'none' }}>
                    <MobileMenuButton />
                </div>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="content-view error">
                <div className="content-header" style={{ borderBottom: 'none' }}>
                    <MobileMenuButton />
                </div>
                <p>Item not found</p>
            </div>
        );
    }

    return (
        <div className="content-view">
            <div className="content-header">
                <MobileMenuButton />

                <div className="content-title">
                    <span className="content-icon">{item.type === 'text' ? '📝' : '🖼️'}</span>
                    <span>{item.type === 'text' ? 'Text' : 'Image'}</span>
                </div>
                <button
                    className="delete-button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? 'Deleting...' : '🗑️ Delete'}
                </button>
            </div>

            <div className="content-body">
                {item.unlocked ? (
                    <div className="unlocked-content">
                        {item.type === 'text' ? (
                            <div className="text-content">{item.content}</div>
                        ) : (
                            <img
                                src={item.content || ''}
                                alt="Decrypted image"
                                className="image-content"
                            />
                        )}
                        <ExtendButtons />
                    </div>
                ) : (
                    <div className="locked-content">
                        <div className="lock-icon">🔒</div>
                        <h2>Content Locked</h2>
                        <div className="countdown">{countdown}</div>
                        <ExtendButtons />
                    </div>
                )}
            </div>
        </div>
    );
}
