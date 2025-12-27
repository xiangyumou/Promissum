'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
    Settings as SettingsIcon,
    Save,
    RotateCcw,
    Palette,
    Languages,
    Shield,
    Eye,
    EyeOff,
    Trash2,
    ExternalLink,
    Clock,
    LayoutList,
    AlertCircle,
    RefreshCw,
    Database,
    Zap,
    Lock,
    Key,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import ExportButton from '@/components/ExportButton';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Dashboard from '@/components/Dashboard'; // Moved here as per previous refactor
import { queryClient } from '@/lib/query-client';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');

    // Destructure all settings
    const {
        // Default Behavior
        defaultDurationMinutes,
        setDefaultDuration,

        // Interface
        dateTimeFormat,
        setDateTimeFormat,
        compactMode,
        setCompactMode,

        // Behavior
        confirmDelete,
        setConfirmDelete,
        confirmExtend,
        setConfirmExtend,
        autoRefreshInterval,
        setAutoRefreshInterval,
        defaultSort,
        setDefaultSort,

        // Caching
        cacheTTLMinutes,
        setCacheTTLMinutes,

        // Security
        privacyMode,
        setPrivacyMode,
        autoPrivacyDelayMinutes,
        setAutoPrivacyDelayMinutes,
        panicUrl,
        setPanicUrl,
        panicShortcut,
        setPanicShortcut,
        apiToken,
        setApiToken,

        // Actions
        resetToDefaults
    } = useSettings();

    // Local state for inputs to avoid jitter / validation before save
    const [durationInput, setDurationInput] = useState(defaultDurationMinutes.toString());
    const [panicUrlInput, setPanicUrlInput] = useState(panicUrl);
    const [panicShortcutInput, setPanicShortcutInput] = useState(panicShortcut);

    // API Check State
    const [isCheckingApi, setIsCheckingApi] = useState(false);
    const [apiStatus, setApiStatus] = useState<'idle' | 'ok' | 'error'>('idle');

    // Clear Data State
    const [isClearing, setIsClearing] = useState(false);

    // Confirmation Dialog States
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Handlers
    const handleSave = () => {
        // Validate and save duration
        const minutes = parseInt(durationInput);
        if (!isNaN(minutes) && minutes > 0) {
            setDefaultDuration(minutes);
        }

        // Save URLs and Shortcuts
        setPanicUrl(panicUrlInput);
        setPanicShortcut(panicShortcutInput);

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
            setPanicUrlInput('https://google.com');
            setPanicShortcutInput('alt+p');
            setApiStatus('idle');
        }, 0);
        toast.success(t('changesSaved'));
    };

    const handleClearData = () => {
        setShowClearConfirm(true);
    };

    const confirmClearData = async () => {
        setIsClearing(true);
        try {
            await Promise.all([
                queryClient.cancelQueries(),
                queryClient.invalidateQueries(),
                queryClient.removeQueries()
            ]);

            localStorage.clear();
            sessionStorage.clear();

            // Hard reload to reset everything
            window.location.reload();
        } catch (error) {
            console.error('Failed to clear data', error);
            toast.error(tCommon('error'));
            setIsClearing(false);
        }
    };

    // Helper for clearing cache (kept simple as it's less destructive)
    const handleClearCache = () => {
        queryClient.removeQueries();
        toast.success(t('cacheCleared'));
    };

    const handleCheckConnection = async () => {
        setIsCheckingApi(true);
        setApiStatus('idle');
        try {
            const res = await fetch('/api/stats');
            if (res.ok) {
                setApiStatus('ok');
                toast.success(t('connectionOk'));
            } else {
                setApiStatus('error');
                toast.error(t('connectionFailed'));
            }
        } catch (error) {
            setApiStatus('error');
            toast.error(t('connectionFailed'));
        } finally {
            setIsCheckingApi(false);
        }
    };

    const handleApiTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiToken(e.target.value);
        // Reset status on change
        setApiStatus('idle');
    };

    return (
        <div className="h-full overflow-y-auto bg-background custom-scrollbar">
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <SettingsIcon size={32} className="text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                </div>

                {/* Appearance Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Palette size={20} className="text-primary" />
                        {t('appearance')}
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-5">
                        {/* Theme */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Palette size={16} />
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
                                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="yyyy-MM-dd HH:mm">YYYY-MM-DD HH:mm</option>
                                <option value="dd/MM/yyyy HH:mm">DD/MM/YYYY HH:mm</option>
                                <option value="MM/dd/yyyy HH:mm">MM/DD/YYYY HH:mm</option>
                            </select>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Compact Mode */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <LayoutList size={16} />
                                    {t('compactMode')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('compactModeDesc')}</p>
                            </div>
                            <button
                                onClick={() => setCompactMode(!compactMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${compactMode ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
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
                                    className="w-24 px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                <button
                                    onClick={() => setConfirmDelete(!confirmDelete)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${confirmDelete ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${confirmDelete ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pl-6">
                                <span className="text-sm text-foreground">{t('confirmExtend')}</span>
                                <button
                                    onClick={() => setConfirmExtend(!confirmExtend)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${confirmExtend ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${confirmExtend ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
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
                                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value={0}>{t('refreshOff')}</option>
                                <option value={30}>30s</option>
                                <option value={60}>1m</option>
                                <option value={300}>5m</option>
                            </select>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Default Sort */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <LayoutList size={16} />
                                {t('defaultSort')}
                            </label>
                            <select
                                value={defaultSort}
                                // Cast to specific string literal type is handled by Typescript if value matches
                                onChange={(e) => setDefaultSort(e.target.value as any)}
                                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="created_desc">{t('sortCreatedDesc')}</option>
                                <option value="created_asc">{t('sortCreatedAsc')}</option>
                                <option value="decrypt_desc">{t('sortDecryptDesc')}</option>
                                <option value="decrypt_asc">{t('sortDecryptAsc')}</option>
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
                                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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

                {/* Privacy & Security Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Shield size={20} className="text-primary" />
                        {t('privacySecurity')}
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-6">
                        {/* Privacy Mode */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                                    {t('privacyMode')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('privacyModeDesc')}</p>
                            </div>
                            <button
                                onClick={() => setPrivacyMode(!privacyMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${privacyMode ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${privacyMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Auto Privacy Delay */}
                        <div className="flex items-center justify-between pl-6 mt-2">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground">
                                    {t('autoPrivacy')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('autoPrivacyDesc')}</p>
                            </div>
                            <select
                                value={autoPrivacyDelayMinutes}
                                onChange={(e) => setAutoPrivacyDelayMinutes(Number(e.target.value))}
                                className="px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value={0}>{t('off')}</option>
                                <option value={1}>1 min</option>
                                <option value={5}>5 min</option>
                                <option value={15}>15 min</option>
                            </select>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Panic Button URL */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <ExternalLink size={16} />
                                    {t('panicButtonUrl')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('panicButtonUrlDesc')}</p>
                            </div>
                            <input
                                type="url"
                                value={panicUrlInput}
                                onChange={(e) => setPanicUrlInput(e.target.value)}
                                className="w-full px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="https://google.com"
                            />
                        </div>

                        {/* Panic Shortcut */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Key size={16} />
                                    {t('panicShortcut')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('panicShortcutDesc')}</p>
                            </div>
                            <input
                                type="text"
                                value={panicShortcutInput}
                                onChange={(e) => setPanicShortcutInput(e.target.value)}
                                className="w-full px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="alt+p"
                            />
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* API Token */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Lock size={16} />
                                    {t('token')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('tokenDesc')}</p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiToken}
                                    onChange={handleApiTokenChange}
                                    className="flex-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Use system default"
                                />
                                <button
                                    onClick={handleCheckConnection}
                                    disabled={isCheckingApi}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                                        ${apiStatus === 'ok' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                            apiStatus === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                'bg-muted hover:bg-muted/80 text-foreground'}`}
                                >
                                    {isCheckingApi ? (
                                        <RefreshCw size={16} className="animate-spin" />
                                    ) : apiStatus === 'ok' ? (
                                        <CheckCircle2 size={16} />
                                    ) : apiStatus === 'error' ? (
                                        <XCircle size={16} />
                                    ) : (
                                        <RefreshCw size={16} />
                                    )}
                                    {t('checkConnection')}
                                </button>
                            </div>
                            {apiStatus === 'ok' && <p className="text-xs text-green-500">{t('connectionOk')}</p>}
                            {apiStatus === 'error' && <p className="text-xs text-red-500">{t('connectionFailed')}</p>}
                        </div>

                    </div>
                </section>

                {/* Data Management Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Save size={20} className="text-primary" />
                        {t('dataManagement')}
                    </h2>

                    <div className="space-y-4">
                        <ExportButton />

                        <div className="glass-card rounded-xl p-6 border border-red-500/20 bg-red-500/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-semibold text-red-500 flex items-center gap-2">
                                        <Trash2 size={16} />
                                        {t('dangerZone')}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{t('dangerZoneDesc')}</p>
                                </div>
                                <button
                                    onClick={handleClearData}
                                    disabled={isClearing}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {t('clearAllData')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save and Reset Actions */}
                <div className="flex items-center gap-3 pt-4 pb-12">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                    >
                        <Save size={18} />
                        {t('saveChanges')}
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
                    >
                        <RotateCcw size={18} />
                        {t('resetDefaults')}
                    </button>
                </div>
                {/* Dashboard Section */}
                <section className="space-y-4 pt-8 border-t border-border">
                    <Dashboard />
                </section>

                <ConfirmDialog
                    isOpen={showResetConfirm}
                    title={t('resetDefaults')}
                    description="Are you sure you want to reset all settings to default?"
                    confirmLabel={t('resetDefaults')}
                    variant="warning"
                    onConfirm={confirmReset}
                    onCancel={() => setShowResetConfirm(false)}
                />

                <ConfirmDialog
                    isOpen={showClearConfirm}
                    title={t('clearAllData')}
                    description={t('clearDataConfirm')}
                    confirmLabel={t('clearAllData')}
                    variant="danger"
                    onConfirm={confirmClearData}
                    onCancel={() => setShowClearConfirm(false)}
                />
            </div>
        </div>
    );
}
