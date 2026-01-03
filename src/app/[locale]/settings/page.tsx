'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
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
    CheckCircle2,
    XCircle,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import ExportButton from '@/components/ExportButton';
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

        // Caching
        cacheTTLMinutes,
        setCacheTTLMinutes,

        // Security
        privacyMode,
        setPrivacyMode,
        autoPrivacyDelayMinutes,
        setAutoPrivacyDelayMinutes,
        apiToken,
        setApiToken,
        apiUrl,
        setApiUrl,

        // Actions
        resetToDefaults,
        themeConfig,
        setThemeConfig
    } = useSettings();

    // Local state for inputs to avoid jitter / validation before save
    const [durationInput, setDurationInput] = useState(defaultDurationMinutes.toString());
    const [apiUrlInput, setApiUrlInput] = useState(apiUrl);

    // API Check State
    const [isCheckingApi, setIsCheckingApi] = useState(false);
    const [apiStatus, setApiStatus] = useState<'idle' | 'ok' | 'error'>('idle');

    // Clear Data State
    const [isClearing, setIsClearing] = useState(false);



    // Confirmation Dialog States
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const hasMounted = useHasMounted();



    // Sync TTL changes to cache config
    useEffect(() => {
        if (hasMounted) {
            setCacheTTL(cacheTTLMinutes);
        }
    }, [cacheTTLMinutes, hasMounted]);

    // Computed Styles Logic
    const [computedStyles, setComputedStyles] = useState<Record<string, string>>({});

    // Helper to convert RGB to Hex
    const rgbToHex = (val: string) => {
        if (!val) return '';
        val = val.trim();
        if (val.startsWith('#')) return val;

        const rgb = val.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
            return "#" +
                ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
        }
        return '';
    };

    useEffect(() => {
        // Small delay to ensure theme is applied
        const updateStyles = () => {
            if (typeof window === 'undefined') return;
            const style = getComputedStyle(document.documentElement);
            const vars = [
                '--primary', '--bg', '--surface-1', '--surface-2',
                '--text', '--accent', '--warning', '--success'
            ];
            const newStyles: Record<string, string> = {};
            vars.forEach(v => {
                const val = style.getPropertyValue(v).trim();
                newStyles[v] = rgbToHex(val) || val;
            });
            setComputedStyles(newStyles);
        };

        // Run immediately
        updateStyles();

        // Listen for theme changes using MutationObserver
        const observer = new MutationObserver(updateStyles);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
        return () => observer.disconnect();
    }, [t]); // Re-run if translations change

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

            // Clear all storage
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
        } catch (_error) {
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
                                className="premium-select"
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
                            <ToggleSwitch
                                checked={compactMode}
                                onChange={setCompactMode}
                                aria-label={t('compactMode')}
                            />
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Theme Customization */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-foreground">
                                        {t('themeCustomization')}
                                    </label>
                                    <p className="text-xs text-muted-foreground">{t('themeCustomizationDesc')}</p>
                                </div>
                                <button
                                    onClick={() => setThemeConfig({})}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <RotateCcw size={12} />
                                    {t('resetTheme')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { key: '--primary', label: t('primaryColor') },
                                    { key: '--bg', label: t('backgroundColor') },
                                    { key: '--surface-1', label: t('surface1') },
                                    { key: '--surface-2', label: t('surface2') },
                                    { key: '--text', label: t('textColor') },
                                    { key: '--accent', label: t('accentColor') },
                                    { key: '--warning', label: t('warningStatus') },
                                    { key: '--success', label: t('successStatus') },
                                ].map((variable) => {
                                    // Helper to ensure valid color for input
                                    // If empty or invalid, color input shows black.
                                    const val = themeConfig[variable.key] || computedStyles[variable.key] || '#000000';
                                    return (
                                        <div key={variable.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">{variable.label}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground opacity-50">{variable.key}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={val}
                                                    onChange={(e) => {
                                                        const newConfig = { ...themeConfig, [variable.key]: e.target.value };
                                                        setThemeConfig(newConfig);
                                                    }}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                />
                                                <input
                                                    type="text"
                                                    className="w-24 text-xs bg-transparent border-none text-right focus:outline-none font-mono"
                                                    placeholder="Default"
                                                    value={themeConfig[variable.key] || ''}
                                                    onChange={(e) => {
                                                        const newConfig = { ...themeConfig, [variable.key]: e.target.value };
                                                        // Filter out empty
                                                        if (!e.target.value) delete newConfig[variable.key];
                                                        setThemeConfig(newConfig);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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
                            <ToggleSwitch
                                checked={privacyMode}
                                onChange={setPrivacyMode}
                                aria-label={t('privacyMode')}
                            />
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
                                className="premium-select"
                            >
                                <option value={0}>{t('off')}</option>
                                <option value={1}>1 min</option>
                                <option value={5}>5 min</option>
                                <option value={15}>15 min</option>
                            </select>
                        </div>

                        {/* API URL */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <ExternalLink size={16} />
                                    {t('apiUrl')}
                                </label>
                                <p className="text-xs text-muted-foreground">{t('apiUrlDesc')}</p>
                            </div>
                            <input
                                type="url"
                                value={apiUrlInput}
                                onChange={(e) => setApiUrlInput(e.target.value)}
                                onBlur={() => setApiUrl(apiUrlInput)}
                                className="flex-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                                placeholder="http://localhost:3000/api/v1"
                            />
                        </div>

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
                        {hasMounted && <ExportButton />}

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
