'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Modal from './ui/Modal';
import { cn } from '@/lib/utils';
import {
    Clock,
    FileText,
    Image as ImageIcon,
    Upload,
    RefreshCw,
    Plus,
    Lock,
    AlertCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { timeService } from '@/lib/services/time-service';
import { calculateDurationMinutes, calculateUnlockTimeInfo } from '@/lib/utils/unlock-time';

interface AddModalProps {
    isOpen: boolean;
    defaultDuration: number;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
}

// Duration presets in minutes
const DURATION_PRESETS = [
    { label: '1m', minutes: 1 },
    { label: '10m', minutes: 10 },
    { label: '1h', minutes: 60 },
    { label: '6h', minutes: 360 },
    { label: '1d', minutes: 1440 },
];

type TimeMode = 'duration' | 'absolute';

export default function AddModal({ isOpen, defaultDuration, onClose, onSubmit }: AddModalProps) {
    const t = useTranslations('AddModal');
    const tCommon = useTranslations('Common');

    const [type, setType] = useState<'text' | 'image'>('text');
    const [title, setTitle] = useState(''); // Item title (optional)
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [timeMode, setTimeMode] = useState<TimeMode>('duration');
    const [accumulatedDuration, setAccumulatedDuration] = useState(defaultDuration);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset duration when modal opens
    useEffect(() => {
        if (isOpen) {
            setAccumulatedDuration(defaultDuration);
            // Default to duration mode when re-opening
            setTimeMode('duration');
        }
    }, [isOpen, defaultDuration]);

    // Absolute time state
    const getDefaultAbsoluteTime = () => {
        const d = new Date(timeService.now() + 60 * 60 * 1000);
        return {
            year: d.getFullYear().toString().slice(-2),
            month: (d.getMonth() + 1).toString().padStart(2, '0'),
            day: d.getDate().toString().padStart(2, '0'),
            hour: d.getHours().toString().padStart(2, '0'),
            minute: d.getMinutes().toString().padStart(2, '0'),
        };
    };

    const [absoluteTime, setAbsoluteTime] = useState(getDefaultAbsoluteTime);

    // Calculate duration in minutes based on current mode
    const calculatedDuration = useMemo(() => {
        return calculateDurationMinutes(timeMode, accumulatedDuration, absoluteTime, timeService.now());
    }, [timeMode, accumulatedDuration, absoluteTime]);

    // Calculate and format the unlock time
    const unlockTimeInfo = useMemo(() => {
        const info = calculateUnlockTimeInfo(calculatedDuration, timeMode, absoluteTime, timeService.now());
        return {
            ...info,
            remaining: info.isValid ? info.remaining : t('invalidTime'),
        };
    }, [calculatedDuration, timeMode, absoluteTime, t]);

    const handlePresetClick = (minutes: number) => {
        setAccumulatedDuration(prev => prev + minutes);
    };

    const handleCustomDurationChange = (value: string) => {
        const num = Math.max(0, parseInt(value) || 0);
        setAccumulatedDuration(num);
    };

    const handleResetDuration = () => {
        setAccumulatedDuration(defaultDuration);
    };

    const handleAbsoluteTimeChange = (field: keyof typeof absoluteTime, value: string) => {
        setAbsoluteTime(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (type === 'text' && !text.trim()) return;
        if (type === 'image' && !file) return;
        if (!unlockTimeInfo.isValid) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('type', type);

            if (timeMode === 'absolute') {
                formData.append('decryptAt', unlockTimeInfo.unlockDate.getTime().toString());
            } else {
                formData.append('durationMinutes', calculatedDuration.toString());
            }

            // Add metadata with title if provided
            if (title.trim()) {
                formData.append('metadata', JSON.stringify({ title: title.trim() }));
            }

            if (type === 'text') {
                formData.append('content', text);
            } else if (file) {
                formData.append('file', file);
            }

            await onSubmit(formData);

            // Reset form
            setTitle('');
            setText('');
            setFile(null);
            setAccumulatedDuration(defaultDuration);
            setTimeMode('duration');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    // Paste event handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isOpen || type !== 'image') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        setFile(blob);
                        e.preventDefault(); // Prevent default paste behavior
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, type]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            className="md:max-w-[500px]"
        >
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
                {/* Type Selection */}
                <div className="flex bg-card/50 p-1 rounded-xl border border-border">
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all",
                            type === 'text'
                                ? "bg-accent text-accent-foreground shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => setType('text')}
                    >
                        <FileText size={16} />
                        {tCommon('textNote')}
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all",
                            type === 'image'
                                ? "bg-accent text-accent-foreground shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => setType('image')}
                    >
                        <ImageIcon size={16} />
                        {tCommon('image')}
                    </button>
                </div>

                {/* Title Input (Optional) */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                        {t('itemTitle')}
                    </label>
                    <input
                        type="text"
                        className="premium-input"
                        placeholder={t('titlePlaceholder')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                    />
                </div>

                {/* Content Input */}
                <div>
                    {type === 'text' ? (
                        <textarea
                            className="premium-input resize-none"
                            placeholder={t('enterContent')}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={5}
                            autoFocus
                        />
                    ) : (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                className={cn(
                                    "w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors",
                                    file
                                        ? "border-primary/50 bg-primary/10"
                                        : "border-border hover:border-primary/30 hover:bg-accent/30"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {file ? (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-primary truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-primary/70">{t('changeImage')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{t('uploadImage')}</p>
                                            <p className="text-xs text-muted-foreground/70">{t('uploadHint')}</p>
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Time Selection */}
                <div className="space-y-4">
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

                <button
                    type="submit"
                    className="premium-button w-full py-4 text-white rounded-xl"
                    disabled={isSubmitting || (type === 'text' ? !text.trim() : !file) || !unlockTimeInfo.isValid}
                >
                    {isSubmitting ? (
                        <>
                            <RefreshCw size={18} className="animate-spin" />
                            {t('encrypting')}
                        </>
                    ) : (
                        <>
                            <Lock size={18} />
                            {t('encryptAndSave')}
                        </>
                    )}
                </button>
            </form>
        </Modal>
    );
}

function TimeInput({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder: string }) {
    return (
        <input
            type="text"
            maxLength={2}
            className="w-10 p-1 text-center bg-transparent border-b-2 border-border focus:border-primary focus:outline-none font-mono font-medium rounded text-lg text-foreground placeholder-muted-foreground/50 transition-colors"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
            onFocus={(e) => e.target.select()}
        />
    );
}
