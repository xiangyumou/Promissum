'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Palette, Languages, Shield, Eye, EyeOff, Bell, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import ExportButton from '@/components/ExportButton';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Dashboard from '@/components/Dashboard';

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');

    const {
        defaultDurationMinutes,
        privacyMode,
        notificationsEnabled,
        panicUrl,
        setDefaultDuration,
        setPrivacyMode,
        setNotificationsEnabled,
        setPanicUrl,
        resetToDefaults,
    } = useSettings();

    const [durationInput, setDurationInput] = useState(defaultDurationMinutes.toString());
    const [panicUrlInput, setPanicUrlInput] = useState(panicUrl);
    const [isClearing, setIsClearing] = useState(false);

    const handleSave = () => {
        const minutes = parseInt(durationInput);
        if (!isNaN(minutes) && minutes > 0) {
            setDefaultDuration(minutes);
        }
        setPanicUrl(panicUrlInput);
        toast.success(t('changesSaved'));
    };

    const handleReset = () => {
        resetToDefaults();
        setDurationInput('60');
        setPanicUrlInput('https://google.com');
        toast.success(t('changesSaved'));
    };

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            setIsClearing(true);
            try {
                localStorage.clear();
                window.location.reload();
            } catch (error) {
                console.error('Failed to clear data', error);
                setIsClearing(false);
            }
        }
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
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Palette size={16} />
                                {t('theme')}
                            </label>
                            <ThemeToggle />
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Languages size={16} />
                                {t('language')}
                            </label>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </section>

                {/* Behavior Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <SettingsIcon size={20} className="text-primary" />
                        {t('defaultBehavior')}
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-6">
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

                        {/* Notifications Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Bell size={16} />
                                    Notifications
                                </label>
                                <p className="text-xs text-muted-foreground">Enable system notifications</p>
                            </div>
                            <button
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Privacy & Security Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Shield size={20} className="text-primary" />
                        Privacy & Security
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-6">
                        {/* Privacy Mode */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                                    Privacy Mode
                                </label>
                                <p className="text-xs text-muted-foreground">Blur sensitive content in lists by default</p>
                            </div>
                            <button
                                onClick={() => setPrivacyMode(!privacyMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${privacyMode ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${privacyMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        {/* Panic Button URL */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <ExternalLink size={16} />
                                    Panic Button URL
                                </label>
                                <p className="text-xs text-muted-foreground">URL to open when panic button is pressed</p>
                            </div>
                            <input
                                type="url"
                                value={panicUrlInput}
                                onChange={(e) => setPanicUrlInput(e.target.value)}
                                className="w-full px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="https://google.com"
                            />
                        </div>
                    </div>
                </section>

                {/* Data Management Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Save size={20} className="text-primary" />
                        Data Management
                    </h2>

                    <div className="space-y-4">
                        <ExportButton />

                        <div className="glass-card rounded-xl p-6 border border-red-500/20 bg-red-500/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-semibold text-red-500 flex items-center gap-2">
                                        <Trash2 size={16} />
                                        Danger Zone
                                    </h3>
                                    <p className="text-xs text-muted-foreground">Clear all local data and reset application</p>
                                </div>
                                <button
                                    onClick={handleClearData}
                                    disabled={isClearing}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear All Data
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
            </div>
        </div>
    );
}
