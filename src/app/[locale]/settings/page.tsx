'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ExportButton from '@/components/ExportButton';

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');

    const {
        defaultDurationMinutes,
        setDefaultDuration,
        resetToDefaults,
    } = useSettings();

    const [durationInput, setDurationInput] = useState(defaultDurationMinutes.toString());

    const handleSave = () => {
        const minutes = parseInt(durationInput);
        if (!isNaN(minutes) && minutes > 0) {
            setDefaultDuration(minutes);
            toast.success(t('changesSaved'));
        }
    };

    const handleReset = () => {
        resetToDefaults();
        setDurationInput('60');
        toast.success(t('changesSaved'));
    };

    return (
        <div className="h-full overflow-y-auto bg-background custom-scrollbar">
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <SettingsIcon size={32} className="text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                </div>

                {/* Default Behavior Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        {t('defaultBehavior')}
                    </h2>

                    <div className="glass-card rounded-xl p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
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
                                className="w-32 px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <span className="text-sm text-muted-foreground">{t('minutes')}</span>
                        </div>
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4">
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
            </div>
        </div>
    );
}
