'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Dashboard from './Dashboard';
import { useItem, useDeleteItem, useExtendItem } from '@/lib/queries';
import { useCountdown } from '@/lib/use-countdown';
import { motion } from 'framer-motion';
import { Menu, Trash2, FileText, Image as ImageIcon, Lock, Unlock, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/Skeleton';
import ConfirmationModal from './ui/ConfirmationModal';

interface ContentViewProps {
    selectedId: string | null;
    onDelete: (id: string) => void;
    onMenuClick: () => void;
}

export default function ContentView({ selectedId, onDelete, onMenuClick }: ContentViewProps) {
    const [extendingMinutes, setExtendingMinutes] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch item with automatic refetching
    const { data: item, isLoading: loading, error } = useItem(selectedId);

    // Delete mutation
    const deleteMutation = useDeleteItem();

    // Extend mutation
    const extendMutation = useExtendItem(selectedId || '');

    // Countdown timer
    const countdown = useCountdown(item?.decrypt_at || null, item?.unlocked || false);

    const handleDelete = async () => {
        if (!item || deleteMutation.isPending) return;

        toast.promise(
            deleteMutation.mutateAsync(item.id),
            {
                loading: 'Deleting...',
                success: () => {
                    onDelete(item.id);
                    setShowDeleteConfirm(false);
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
                            return 'Conflict detected, data refreshed. Please try again.';
                        }
                        return 'Failed to extend lock';
                    },
                }
            );
        } finally {
            setExtendingMinutes(null);
        }
    };

    // Mobile menu button
    const MobileMenuButton = () => (
        <button
            className="md:hidden p-2 -ml-2 mr-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
        >
            <Menu size={20} />
        </button>
    );

    // Extend buttons
    const ExtendButtons = () => (
        <div className={cn("flex flex-col gap-3", item?.unlocked ? "mt-6" : "mt-0")}>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">Add Time</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {[1, 10, 60, 360, 1440].map((mins) => (
                    <button
                        key={mins}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                            "bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105 active:scale-95",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        )}
                        onClick={() => handleExtend(mins)}
                        disabled={extendingMinutes !== null}
                    >
                        {extendingMinutes === mins ? (
                            <RefreshCw size={12} className="animate-spin" />
                        ) : (
                            `+${mins >= 60 ? `${mins / 60}h` : `${mins}m`}`
                        )}
                    </button>
                ))}
            </div>
        </div>
    );

    // Empty state (Dashboard wrapper)
    if (!selectedId) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-auto custom-scrollbar">
                <div className="md:hidden flex items-center px-4 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <MobileMenuButton />
                    <span className="font-semibold text-white tracking-tight">Dashboard</span>
                </div>
                <Dashboard />
            </div>
        );
    }

    // Loading State
    if (loading) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <MobileMenuButton />
                        <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
                        <Skeleton className="h-4 w-32 bg-white/5" />
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md space-y-4 flex flex-col items-center">
                        <Skeleton className="h-24 w-24 rounded-2xl bg-white/5" />
                        <Skeleton className="h-6 w-48 bg-white/5" />
                        <Skeleton className="h-12 w-40 bg-white/5" />
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (!item || error) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <div className="flex items-center px-4 py-4 border-b border-white/5">
                    <MobileMenuButton />
                    <span className="font-medium text-red-400">Error</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <AlertCircle size={48} className="text-zinc-700 mb-4" />
                    <p>Item not found or failed to load</p>
                    <button onClick={() => onDelete(selectedId)} className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors">
                        Clear from list
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full relative"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <MobileMenuButton />

                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl shadow-lg border",
                                item.type === 'text'
                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                    : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            )}>
                                {item.type === 'text' ? <FileText size={20} /> : <ImageIcon size={20} />}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
                                    {item.type === 'text' ? 'Text Note' : 'Image Content'}
                                </h1>
                                <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                                    {item.type === 'text' ? 'Encrypted Text' : 'Encrypted Image'}
                                    {item.layer_count > 1 && (
                                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                            ×{item.layer_count} layers
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        onClick={() => setShowDeleteConfirm(true)}
                        title="Delete Item"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="max-w-3xl mx-auto h-full flex flex-col">
                        {item.unlocked ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 shadow-lg shadow-emerald-500/5">
                                    <Unlock size={20} className="text-emerald-400" />
                                    <span className="font-semibold tracking-wide">Content Decrypted Successfully</span>
                                </div>

                                {item.type === 'text' ? (
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                                        <div className="relative glass-card p-8 rounded-2xl min-h-[200px]">
                                            <pre className="whitespace-pre-wrap font-sans text-zinc-200 leading-relaxed text-lg">{item.content}</pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group flex justify-center">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                                        <div className="relative glass-card p-4 rounded-2xl w-full flex justify-center">
                                            <img
                                                src={item.content || ''}
                                                alt="Decrypted content"
                                                className="max-h-[70vh] rounded-lg shadow-2xl"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-white/5">
                                    <ExtendButtons />
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 pb-20">
                                <motion.div
                                    className="relative group"
                                    animate={{
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        duration: 6,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
                                    <div className="w-40 h-40 glass-card rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10 relative z-10 bg-black/40">
                                        <Lock size={64} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 bg-indigo-500 text-white p-3 rounded-2xl shadow-lg z-20 shadow-indigo-500/30">
                                        <Clock size={24} />
                                    </div>
                                </motion.div>

                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Time Locked</h2>
                                    <p className="text-zinc-400 text-lg">This content is sealed in the vault</p>
                                </div>

                                <div className="glass-card px-10 py-8 rounded-3xl border border-white/10 min-w-[320px] bg-black/40 shadow-2xl">
                                    <div className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wider drop-shadow-sm">
                                        {countdown}
                                    </div>
                                    <div className="text-xs text-center text-zinc-500 mt-3 font-bold uppercase tracking-[0.2em]">
                                        Remaining Time
                                    </div>
                                </div>

                                <div className="text-sm text-zinc-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                    Unlocks on <span className="text-zinc-300 font-medium ml-1">{new Date(item.decrypt_at).toLocaleString()}</span>
                                </div>

                                <div className="pt-4 w-full max-w-md">
                                    <ExtendButtons />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Sealed Item"
                description="Are you sure you want to delete this item? This action is permanent and the encrypted content will be lost forever."
                confirmText="Delete Forever"
                isLoading={deleteMutation.isPending}
            />
        </>
    );
}
