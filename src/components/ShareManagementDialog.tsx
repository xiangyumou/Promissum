'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { Trash2, RefreshCw, Shield, Calendar, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ShareData } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

interface ShareManagementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
}

export default function ShareManagementDialog({ isOpen, onClose, itemId }: ShareManagementDialogProps) {
    const t = useTranslations('Share');
    const tCommon = useTranslations('Common');
    const locale = useLocale();

    const [shares, setShares] = useState<ShareData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const dateLocale = locale === 'zh' ? zhCN : enUS;

    const fetchShares = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/shares?itemId=${itemId}`);
            if (!response.ok) throw new Error('Failed to fetch shares');

            const data: ShareData[] = await response.json();
            setShares(data);
        } catch (error) {
            console.error('Error fetching shares:', error);
            toast.error(t('fetchSharesError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchShares();
        }
    }, [isOpen, itemId]);

    const handleRevoke = async (shareToken: string) => {
        try {
            const response = await fetch(`/api/shares/${shareToken}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to revoke share');

            toast.success(t('shareRevoked'));
            // Refresh shares list
            await fetchShares();
        } catch (error) {
            console.error('Error revoking share:', error);
            toast.error(t('revokeError'));
        }
    };

    const getPermissionIcon = (permission: string) => {
        switch (permission) {
            case 'view':
                return <Eye size={14} />;
            case 'view-extend':
                return <RefreshCw size={14} />;
            case 'full':
                return <Shield size={14} />;
            default:
                return <Eye size={14} />;
        }
    };

    const getPermissionColor = (permission: string) => {
        switch (permission) {
            case 'view':
                return 'text-blue-500 bg-blue-500/10';
            case 'view-extend':
                return 'text-yellow-500 bg-yellow-500/10';
            case 'full':
                return 'text-red-500 bg-red-500/10';
            default:
                return 'text-gray-500 bg-gray-500/10';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('manageShares')}
            className="md:max-w-[600px]"
        >
            <div className="p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                    </div>
                ) : shares.length === 0 ? (
                    <div className="text-center py-12">
                        <Shield size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">{t('noShares')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shares.map((share) => {
                            const isExpired = share.expiresAt && share.expiresAt < Date.now();

                            return (
                                <div
                                    key={share.id}
                                    className={cn(
                                        "p-4 rounded-lg border transition-all",
                                        isExpired
                                            ? "border-destructive/20 bg-destructive/5 opacity-60"
                                            : "border-border bg-card hover:shadow-sm"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            {/* Permission Badge */}
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1",
                                                    getPermissionColor(share.permission)
                                                )}>
                                                    {getPermissionIcon(share.permission)}
                                                    {t(`permission${share.permission.charAt(0).toUpperCase() + share.permission.slice(1).replace('-', '')}`)}
                                                </span>
                                                {isExpired && (
                                                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive">
                                                        {t('expired')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Share URL */}
                                            <p className="text-xs font-mono text-muted-foreground break-all">
                                                {window.location.origin}/s/{share.shareToken}
                                            </p>

                                            {/* Metadata */}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {t('created')} {formatDistanceToNow(share.createdAt, { addSuffix: true, locale: dateLocale })}
                                                </span>
                                                {share.expiresAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {isExpired
                                                            ? t('expired') + ' ' + formatDistanceToNow(share.expiresAt, { addSuffix: true, locale: dateLocale })
                                                            : t('expires') + ' ' + formatDistanceToNow(share.expiresAt, { addSuffix: true, locale: dateLocale })
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => handleRevoke(share.shareToken)}
                                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                            title={t('revokeShare')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Refresh Button */}
                {shares.length > 0 && (
                    <button
                        onClick={fetchShares}
                        disabled={isLoading}
                        className="mt-4 w-full py-2 rounded-lg border border-border hover:bg-accent transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                        {t('refresh')}
                    </button>
                )}
            </div>
        </Modal>
    );
}
