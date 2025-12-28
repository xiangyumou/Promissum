'use client';

import { useState } from 'react';
import Modal from './ui/Modal';
import { Share2, Copy, Clock, Check, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SharePermission, CreateShareRequest, ShareData } from '@/lib/types';
import { toast } from 'sonner';

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    onShareCreated?: (share: ShareData) => void;
}

export default function ShareDialog({ isOpen, onClose, itemId, onShareCreated }: ShareDialogProps) {
    const t = useTranslations('Share');
    const tCommon = useTranslations('Common');

    const [permission, setPermission] = useState<SharePermission>('view');
    const [expiresIn, setExpiresIn] = useState<number>(24); // Hours
    const [shareUrl, setShareUrl] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerateLink = async () => {
        setIsGenerating(true);

        try {
            const expiresAt = Date.now() + expiresIn * 60 * 60 * 1000;

            const request: CreateShareRequest = {
                itemId,
                permission,
                expiresAt
            };

            const response = await fetch('/api/shares', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error('Failed to create share');
            }

            const share: ShareData = await response.json();

            // Generate share URL
            const origin = window.location.origin;
            const url = `${origin}/s/${share.shareToken}`;
            setShareUrl(url);

            // Auto-copy to clipboard
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);

            toast.success(t('linkCreated'));

            if (onShareCreated) {
                onShareCreated(share);
            }
        } catch (error) {
            console.error('Error creating share:', error);
            toast.error(t('createShareError'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = async () => {
        if (!shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            toast.success(t('linkCopied'));
        } catch (error) {
            toast.error(t('copyError'));
        }
    };

    const handleClose = () => {
        setShareUrl('');
        setPermission('view');
        setExpiresIn(24);
        setIsCopied(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('shareItem')}
            className="md:max-w-[500px]"
        >
            <div className="p-6 space-y-6">
                {!shareUrl ? (
                    <>
                        {/* Permission Selection */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-3">
                                {t('selectPermission')}
                            </label>
                            <div className="space-y-2">
                                {[
                                    { value: 'view' as SharePermission, label: t('permissionView'), desc: t('permissionViewDesc') },
                                    { value: 'view-extend' as SharePermission, label: t('permissionViewExtend'), desc: t('permissionViewExtendDesc') },
                                    { value: 'full' as SharePermission, label: t('permissionFull'), desc: t('permissionFullDesc') },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setPermission(option.value)}
                                        className={cn(
                                            "w-full p-4 rounded-lg border-2 transition-all text-left",
                                            permission === option.value
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50 hover:bg-accent/30"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
                                                permission === option.value
                                                    ? "border-primary bg-primary"
                                                    : "border-muted-foreground"
                                            )}>
                                                {permission === option.value && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">{option.label}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expiration Time */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-3">
                                <Clock size={14} className="inline mr-1" />
                                {t('expiresIn')}
                            </label>
                            <div className="flex gap-2">
                                {[1, 6, 24, 72, 168].map((hours) => (
                                    <button
                                        key={hours}
                                        type="button"
                                        onClick={() => setExpiresIn(hours)}
                                        className={cn(
                                            "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                            expiresIn === hours
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/70"
                                        )}
                                    >
                                        {hours < 24 ? `${hours}h` : `${hours / 24}d`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerateLink}
                            disabled={isGenerating}
                            className="premium-button w-full py-3 rounded-xl text-white flex items-center justify-center gap-2"
                        >
                            <Share2 size={18} />
                            {isGenerating ? t('generating') : t('generateLink')}
                        </button>
                    </>
                ) : (
                    <>
                        {/* Success State */}
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{t('linkReady')}</h3>
                            <p className="text-sm text-muted-foreground">{t('linkReadyDesc')}</p>
                        </div>

                        {/* Share URL */}
                        <div className="p-4 bg-accent/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={14} className="text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    {t('shareUrl')}
                                </span>
                            </div>
                            <p className="text-sm font-mono break-all text-foreground">
                                {shareUrl}
                            </p>
                        </div>

                        {/* Copy Button */}
                        <button
                            onClick={handleCopyLink}
                            className={cn(
                                "w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                                isCopied
                                    ? "bg-green-500 text-white"
                                    : "bg-primary text-primary-foreground hover:opacity-90"
                            )}
                        >
                            {isCopied ? (
                                <>
                                    <Check size={18} />
                                    {t('copied')}
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    {t('copyLink')}
                                </>
                            )}
                        </button>

                        {/* Info */}
                        <div className="text-center text-xs text-muted-foreground">
                            {t('expiresInInfo', { hours: expiresIn })}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
