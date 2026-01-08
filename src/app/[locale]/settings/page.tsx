'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    RotateCcw,
    Languages,
    Clock,
    AlertCircle,
    RefreshCw,
    Database,
    Zap,
    ArrowLeft,
    Sun
} from 'lucide-react';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { queryClient } from '@/lib/query-client';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useHasMounted } from '@/hooks/useHasMounted';
import { setCacheTTL } from '@/lib/cache-config';
import { Link } from '@/i18n/routing';

import ToggleSwitch from '@/components/ui/ToggleSwitch';

export default function SettingsPage() {
    const t = useTranslations('Settings');

    // Destructure all settings
    const {
        // Default Behavior
        defaultDurationMinutes,
        setDefaultDuration,

        // Interface
        dateTimeFormat,
        setDateTimeFormat,

        // Behavior
        confirmDelete,
        setConfirmDelete,
        confirmExtend,
        setConfirmExtend,
        autoRefreshInterval,
        setAutoRefreshInterval,

        // Caching
        cacheTTLMinutes,
        setCacheTTLMinutes,

        // Actions
        resetToDefaults
    } = useSettings();

    // Local state for inputs to avoid jitter / validation before save
    const [durationInput, setDurationInput] = useState(defaultDurationMinutes.toString());

    // Confirmation Dialog States
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const hasMounted = useHasMounted();

    // Sync TTL changes to cache config
    useEffect(() => {
        if (hasMounted) {
            setCacheTTL(cacheTTLMinutes);
        }
    }, [cacheTTLMinutes, hasMounted]);

    // Handlers
    const handleSave = () => {
        // Validate and save duration
        const minutes = parseInt(durationInput);
        if (!isNaN(minutes) && minutes > 0) {
            setDefaultDuration(minutes);
        }

        toast.success(t('changesSaved'));
    };

    const handleReset = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        resetToDefaults();
        // Sync local state
        setTimeout(() => {
            setDurationInput('60');
        }, 0);
        toast.success(t('changesSaved'));
    };

    // Helper for clearing cache (kept simple as it's less destructive)
    const handleClearCache = () => {
        queryClient.removeQueries();
        toast.success(t('cacheCleared'));
    };

    return (
        <div className="h-full overflow-y-auto bg-background custom-scrollbar">
            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                    {/* Mobile Back Button */}
                    <Link
                        href="/"
                        className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <SettingsIcon size={32} className="text-primary hidden md:block" />
                    <SettingsIcon size={24} className="text-primary md:hidden" />
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
                </div>

                {/* Appearance Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Sun size={20} className="text-primary" />
                        {t('appearance')}
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-5">
                        {/* Theme */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Sun size={16} />
                                {t('theme')}
                            </label>
                            <ThemeToggle />
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Language */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Languages size={16} />
                                {t('language')}
                            </label>
                            <LanguageSwitcher />
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Date Time Format */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Clock size={16} />
                                {t('dateTimeFormat')}
                            </label>
                            <select
                                value={dateTimeFormat}
                                onChange={(e) => setDateTimeFormat(e.target.value)}
                                className="premium-select"
                            >
                                <option value="yyyy-MM-dd HH:mm">YYYY-MM-DD HH:mm</option>
                                <option value="dd/MM/yyyy HH:mm">DD/MM/YYYY HH:mm</option>
                                <option value="MM/dd/yyyy HH:mm">MM/DD/YYYY HH:mm</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Default Behavior Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Zap size={20} className="text-primary" />
                        {t('defaultBehavior')}
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-6">
                        {/* Default Duration */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground">
                                    {t('defaultDuration')}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    {t('defaultDurationDesc')}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    value={durationInput}
                                    onChange={(e) => setDurationInput(e.target.value)}
                                    className="premium-input w-24 text-center py-1.5"
                                />
                                <span className="text-sm text-muted-foreground">{t('minutes')}</span>
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Confirmations */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <AlertCircle size={16} />
                                {t('confirmations')}
                            </label>

                            <div className="flex items-center justify-between pl-6">
                                <span className="text-sm text-foreground">{t('confirmDelete')}</span>
                                <ToggleSwitch
                                    checked={confirmDelete}
                                    onChange={setConfirmDelete}
                                    size="sm"
                                    aria-label={t('confirmDelete')}
                                />
                            </div>

                            <div className="flex items-center justify-between pl-6">
                                <span className="text-sm text-foreground">{t('confirmExtend')}</span>
                                <ToggleSwitch
                                    checked={confirmExtend}
                                    onChange={setConfirmExtend}
                                    size="sm"
                                    aria-label={t('confirmExtend')}
                                />
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Auto Refresh */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <RefreshCw size={16} />
                                {t('autoRefresh')}
                            </label>
                            <select
                                value={autoRefreshInterval}
                                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                                className="premium-select"
                            >
                                <option value={0}>{t('refreshOff')}</option>
                                <option value={30}>30s</option>
                                <option value={60}>1m</option>
                                <option value={300}>5m</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Caching Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Database size={20} className="text-primary" />
                        {t('caching')}
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Clock size={16} />
                                    {t('cacheTTL')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('cacheTTLDesc')}</p>
                            </div>
                            <select
                                value={cacheTTLMinutes}
                                onChange={(e) => setCacheTTLMinutes(Number(e.target.value))}
                                className="premium-select"
                            >
                                <option value={1}>1 min</option>
                                <option value={5}>5 min</option>
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={60}>60 min</option>
                            </select>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        <div className="flex justify-end">
                            <button
                                onClick={handleClearCache}
                                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
                            >
                                <RefreshCw size={16} />
                                {t('clearCache')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Save and Reset Actions */}
                <div className="flex items-center gap-4 pt-4 pb-12">
                    <button
                        onClick={handleSave}
                        className="premium-button px-8 py-3"
                    >
                        <Save size={18} />
                        {t('saveChanges')}
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-3 bg-muted/50 hover:bg-muted text-foreground rounded-xl font-medium transition-all border border-border hover:border-primary/30"
                    >
                        <RotateCcw size={18} />
                        {t('resetDefaults')}
                    </button>
                </div>

                <ConfirmDialog
                    isOpen={showResetConfirm}
                    title={t('resetDefaults')}
                    description={t('resetConfirmDesc')}
                    confirmLabel={t('resetDefaults')}
                    variant="warning"
                    onConfirm={confirmReset}
                    onCancel={() => setShowResetConfirm(false)}
                />
            </div>
        </div>
    );
}
