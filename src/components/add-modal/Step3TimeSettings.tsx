import { Clock, Plus, RefreshCw, Lock, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { TimeMode } from '@/hooks/useAddItemWizard';

// Duration presets in minutes
const DURATION_PRESETS = [
    { label: '1m', minutes: 1 },
    { label: '10m', minutes: 10 },
    { label: '1h', minutes: 60 },
    { label: '6h', minutes: 360 },
    { label: '1d', minutes: 1440 },
];

interface TimeInputProps {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}

function TimeInput({ value, onChange, placeholder }: TimeInputProps) {
    return (
        <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            className="w-12 h-11 min-h-[44px] p-2 text-center bg-transparent border-b-2 border-border focus:border-primary focus:outline-none font-mono font-medium rounded text-lg text-foreground placeholder-muted-foreground/50 transition-colors"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
            onFocus={(e) => e.target.select()}
            aria-label={placeholder}
        />
    );
}

interface Step3TimeSettingsProps {
    timeMode: TimeMode;
    setTimeMode: (mode: TimeMode) => void;
    accumulatedDuration: number;
    setAccumulatedDuration: (duration: number) => void;
    absoluteTime: {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
    };
    setAbsoluteTime: (time: { year: string; month: string; day: string; hour: string; minute: string }) => void;
    handleAbsoluteTimeChange: (field: string, value: string) => void;
    handlePresetClick: (minutes: number) => void;
    handleCustomDurationChange: (value: string) => void;
    handleResetDuration: () => void;
    unlockTimeInfo: {
        isValid: boolean;
        formatted: string;
        remaining: string;
    };
    defaultDuration: number;
}

export default function Step3TimeSettings({
    timeMode,
    setTimeMode,
    accumulatedDuration,
    handlePresetClick,
    handleCustomDurationChange,
    handleResetDuration,
    handleAbsoluteTimeChange,
    absoluteTime,
    unlockTimeInfo,
}: Step3TimeSettingsProps) {
    const t = useTranslations('AddModal');
    const tCommon = useTranslations('Common');

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock size={16} />
                    {t('lockDuration')}
                </label>
                <div className="flex bg-card/50 p-0.5 rounded-lg border border-border">
                    <button
                        type="button"
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            timeMode === 'duration' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setTimeMode('duration')}
                    >
                        {t('duration')}
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            timeMode === 'absolute' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setTimeMode('absolute')}
                    >
                        {t('customDate')}
                    </button>
                </div>
            </div>

            {timeMode === 'duration' ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {DURATION_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                className="px-3 py-1.5 bg-accent/30 hover:bg-accent border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                onClick={() => handlePresetClick(preset.minutes)}
                            >
                                <Plus size={10} />
                                {preset.label}
                            </button>
                        ))}
                        {accumulatedDuration > 0 && (
                            <button
                                type="button"
                                className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full text-xs font-medium transition-colors flex items-center gap-1 border border-destructive/20"
                                onClick={handleResetDuration}
                            >
                                <RefreshCw size={10} />
                                {t('reset')}
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            min="1"
                            value={accumulatedDuration || ''}
                            placeholder="0"
                            onChange={(e) => handleCustomDurationChange(e.target.value)}
                            className="w-full pl-4 pr-12 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-lg text-foreground"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                    {/* Date Inputs */}
                    <div className="flex items-center gap-1">
                        <TimeInput
                            value={absoluteTime.year}
                            onChange={(v) => handleAbsoluteTimeChange('year', v)}
                            placeholder="YY"
                        />
                        <span className="text-zinc-500">/</span>
                        <TimeInput
                            value={absoluteTime.month}
                            onChange={(v) => handleAbsoluteTimeChange('month', v)}
                            placeholder="MM"
                        />
                        <span className="text-zinc-500">/</span>
                        <TimeInput
                            value={absoluteTime.day}
                            onChange={(v) => handleAbsoluteTimeChange('day', v)}
                            placeholder="DD"
                        />
                    </div>
                    <span className="text-zinc-500">@</span>
                    {/* Time Inputs */}
                    <div className="flex items-center gap-1">
                        <TimeInput
                            value={absoluteTime.hour}
                            onChange={(v) => handleAbsoluteTimeChange('hour', v)}
                            placeholder="HH"
                        />
                        <span className="text-zinc-500">:</span>
                        <TimeInput
                            value={absoluteTime.minute}
                            onChange={(v) => handleAbsoluteTimeChange('minute', v)}
                            placeholder="MM"
                        />
                    </div>
                </div>
            )}

            {/* Unlock Preview */}
            <div className={cn(
                "rounded-xl p-4 flex items-center justify-between border transition-all duration-300",
                unlockTimeInfo.isValid
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-full",
                        unlockTimeInfo.isValid ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                    )}>
                        {unlockTimeInfo.isValid ? <Lock size={18} /> : <AlertCircle size={18} />}
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                            {unlockTimeInfo.isValid ? tCommon('unlocksAt') : t('invalidTime')}
                        </p>
                        <p className="text-lg font-bold font-mono tracking-tight">
                            {unlockTimeInfo.isValid ? unlockTimeInfo.formatted : t('checkInput')}
                        </p>
                    </div>
                </div>
                {unlockTimeInfo.isValid && (
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">{t('remaining')}</p>
                        <p className="text-sm font-medium">{unlockTimeInfo.remaining}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
