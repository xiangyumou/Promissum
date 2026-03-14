'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, RefreshCw, AlertCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from './ui/Modal';
import FileUploadZone from './FileUploadZone';
import { calculateUnlockTimeInfo, type AbsoluteTime } from '@/core/time';
import { MS_PER_HOUR } from '@/lib/constants';

// Duration presets in minutes
const DURATION_PRESETS = [
    { label: '1m', minutes: 1 },
    { label: '10m', minutes: 10 },
    { label: '1h', minutes: 60 },
    { label: '6h', minutes: 360 },
    { label: '1d', minutes: 1440 },
];

interface AddModalProps {
    isOpen: boolean;
    defaultDuration: number;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
}

export default function AddModal({ isOpen, defaultDuration, onClose, onSubmit }: AddModalProps) {
    const t = useTranslations('AddModal');
    const tCommon = useTranslations('Common');

    // Form state
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [timeMode, setTimeMode] = useState<'duration' | 'absolute'>('duration');
    const [duration, setDuration] = useState(defaultDuration);
    const [absoluteTime, setAbsoluteTime] = useState<AbsoluteTime>(() => {
        const d = new Date(Date.now() + MS_PER_HOUR);
        return {
            year: d.getFullYear().toString().slice(-2),
            month: (d.getMonth() + 1).toString().padStart(2, '0'),
            day: d.getDate().toString().padStart(2, '0'),
            hour: d.getHours().toString().padStart(2, '0'),
            minute: d.getMinutes().toString().padStart(2, '0'),
        };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate unlock time info
    const unlockTimeInfo = useMemo(() => {
        return calculateUnlockTimeInfo(
            timeMode === 'duration' ? duration : 0,
            timeMode,
            absoluteTime,
            Date.now()
        );
    }, [timeMode, duration, absoluteTime]);

    // Form validation
    const hasContent = text.trim().length > 0 || files.length > 0;
    const isValid = hasContent && unlockTimeInfo.isValid;

    // Handlers
    const handleAddFiles = useCallback((newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const handleRemoveFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handlePresetClick = useCallback((minutes: number) => {
        setDuration(prev => prev + minutes);
    }, []);

    const handleResetDuration = useCallback(() => {
        setDuration(defaultDuration);
    }, [defaultDuration]);

    const handleAbsoluteTimeChange = useCallback((field: keyof AbsoluteTime, value: string) => {
        setAbsoluteTime(prev => ({ ...prev, [field]: value.replace(/\D/g, '').slice(0, 2) }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();

            if (timeMode === 'absolute') {
                formData.append('decryptAt', unlockTimeInfo.unlockDate.getTime().toString());
            } else {
                formData.append('durationMinutes', duration.toString());
            }

            if (title.trim()) {
                formData.append('metadata', JSON.stringify({ title: title.trim() }));
            }

            if (text.trim()) {
                formData.append('text', text);
            }

            for (const file of files) {
                formData.append('files', file);
            }

            await onSubmit(formData);

            // Reset form
            setTitle('');
            setText('');
            setFiles([]);
            setDuration(defaultDuration);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Time input component
    const TimeInput = ({ field, placeholder }: { field: keyof AbsoluteTime; placeholder: string }) => (
        <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            className="w-10 h-9 p-1 text-center bg-transparent border-b-2 border-border focus:border-primary focus:outline-none font-mono font-medium rounded text-base text-foreground placeholder-muted-foreground/50 transition-colors"
            placeholder={placeholder}
            value={absoluteTime[field]}
            onChange={(e) => handleAbsoluteTimeChange(field, e.target.value)}
            onFocus={(e) => e.target.select()}
        />
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            className="md:max-w-[500px]"
        >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        {t('itemTitle')}
                    </label>
                    <input
                        type="text"
                        className="input w-full"
                        placeholder={t('titlePlaceholder')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                    />
                </div>

                {/* Content - Text */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        {t('content')}
                    </label>
                    <textarea
                        className="input w-full resize-none"
                        placeholder={t('enterContent')}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={4}
                    />
                </div>

                {/* Content - Files */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        {t('attachments')}
                    </label>
                    {files.length === 0 ? (
                        <FileUploadZone
                            files={files}
                            onFilesChange={handleAddFiles}
                        />
                    ) : (
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-accent rounded-lg border border-border"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm truncate">{file.name}</span>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <FileUploadZone
                                files={[]}
                                onFilesChange={handleAddFiles}
                            />
                        </div>
                    )}
                </div>

                {/* Time Lock Settings */}
                <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock size={16} />
                            {t('lockDuration')}
                        </label>
                        <div className="flex bg-card p-0.5 rounded-lg border border-border">
                            <button
                                type="button"
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                    timeMode === 'duration'
                                        ? "bg-surface2 text-foreground border border-border"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setTimeMode('duration')}
                            >
                                {t('duration')}
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                    timeMode === 'absolute'
                                        ? "bg-surface2 text-foreground border border-border"
                                        : "text-muted-foreground hover:text-foreground"
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
                                        className="px-2.5 py-1.5 bg-accent hover:bg-accent/80 border border-border rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                        onClick={() => handlePresetClick(preset.minutes)}
                                    >
                                        <Plus size={10} />
                                        {preset.label}
                                    </button>
                                ))}
                                {duration > 0 && (
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md text-xs font-medium transition-colors flex items-center gap-1 border border-destructive/20"
                                        onClick={handleResetDuration}
                                    >
                                        {t('reset')}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={duration || ''}
                                    placeholder="0"
                                    onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="input w-full pl-3 pr-12 py-2 font-mono"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 bg-accent rounded-lg border border-border">
                            <TimeInput field="year" placeholder="YY" />
                            <span className="text-muted-foreground">/</span>
                            <TimeInput field="month" placeholder="MM" />
                            <span className="text-muted-foreground">/</span>
                            <TimeInput field="day" placeholder="DD" />
                            <span className="text-muted-foreground mx-1">@</span>
                            <TimeInput field="hour" placeholder="HH" />
                            <span className="text-muted-foreground">:</span>
                            <TimeInput field="minute" placeholder="MM" />
                        </div>
                    )}

                    {/* Unlock Preview */}
                    <div className={cn(
                        "mt-3 rounded-lg p-3 flex items-center justify-between border",
                        unlockTimeInfo.isValid
                            ? "bg-primary/10 border-primary/20"
                            : "bg-destructive/10 border-destructive/20"
                    )}>
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "p-1.5 rounded-full",
                                unlockTimeInfo.isValid ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                            )}>
                                {unlockTimeInfo.isValid ? <Lock size={16} /> : <AlertCircle size={16} />}
                            </div>
                            <div>
                                <p className={cn(
                                    "text-[10px] uppercase font-semibold tracking-wider",
                                    unlockTimeInfo.isValid ? "text-primary/70" : "text-destructive/70"
                                )}>
                                    {unlockTimeInfo.isValid ? tCommon('unlocksAt') : t('invalidTime')}
                                </p>
                                <p className={cn(
                                    "text-base font-semibold font-mono",
                                    unlockTimeInfo.isValid ? "text-primary" : "text-destructive"
                                )}>
                                    {unlockTimeInfo.isValid ? unlockTimeInfo.formatted : t('checkInput')}
                                </p>
                            </div>
                        </div>
                        {unlockTimeInfo.isValid && (
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-semibold tracking-wider text-primary/70">{t('remaining')}</p>
                                <p className="text-xs font-medium text-primary">{unlockTimeInfo.remaining}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={isSubmitting || !isValid}
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                {t('encrypting')}
                            </>
                        ) : (
                            <>
                                <Lock size={16} />
                                {t('encryptAndSave')}
                            </>
                        )}
                    </button>
                    {!hasContent && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            {t('needContent')}
                        </p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
