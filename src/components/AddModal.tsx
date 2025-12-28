'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Modal from './ui/Modal';
import ImageUploadZone from './ImageUploadZone';
import { cn } from '@/lib/utils';
import {
    Clock,
    FileText,
    Image as ImageIcon,
    Plus,
    RefreshCw,
    Lock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Check
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
type Step = 1 | 2 | 3 | 4;

export default function AddModal({ isOpen, defaultDuration, onClose, onSubmit }: AddModalProps) {
    const t = useTranslations('AddModal');
    const tWizard = useTranslations('Wizard');
    const tCommon = useTranslations('Common');

    // Wizard state
    const [currentStep, setCurrentStep] = useState<Step>(1);

    // Step 1 & 2: Content
    const [type, setType] = useState<'text' | 'image'>('text');
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Step 3: Time settings
    const [timeMode, setTimeMode] = useState<TimeMode>('duration');
    const [accumulatedDuration, setAccumulatedDuration] = useState(defaultDuration);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset duration and step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setAccumulatedDuration(defaultDuration);
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
            setCurrentStep(1);
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

    const handleFileChange = (newFile: File | null) => {
        setFile(newFile);
    };

    // Paste event handler for images
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isOpen || type !== 'image' || currentStep !== 2) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        setFile(blob);
                        e.preventDefault();
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, type, currentStep]);

    // Step validation
    const canProceed = (step: Step): boolean => {
        switch (step) {
            case 1:
                return true; // Type is always valid
            case 2:
                return type === 'text' ? text.trim().length > 0 : file !== null;
            case 3:
                return unlockTimeInfo.isValid;
            case 4:
                return true; // Review step
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < 4 && canProceed(currentStep)) {
            setCurrentStep((prev) => (prev + 1) as Step);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as Step);
        }
    };

    const handleStepClick = (step: Step) => {
        // Can only go back to previous steps, not forward
        if (step < currentStep) {
            setCurrentStep(step);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            className="md:max-w-[550px]"
        >
            <form onSubmit={handleSubmit} className="p-6 pt-2">
                {/* Progress Indicator */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <button
                                    type="button"
                                    onClick={() => handleStepClick(step as Step)}
                                    disabled={step > currentStep}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                                        step < currentStep
                                            ? "bg-primary text-primary-foreground cursor-pointer hover:scale-105"
                                            : step === currentStep
                                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    {step < currentStep ? <Check size={18} /> : step}
                                </button>
                                {step < 4 && (
                                    <div className={cn(
                                        "flex-1 h-1 mx-2 rounded-full transition-all",
                                        step < currentStep ? "bg-primary" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-foreground">
                            {tWizard(`step${currentStep}Title`)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {tWizard('stepProgress', { current: currentStep, total: 4 })}
                        </p>
                    </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[300px]">
                    {/* Step 1: Content Type Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <p className="text-sm text-muted-foreground text-center mb-6">
                                {tWizard('selectContentType')}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    className={cn(
                                        "p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3",
                                        type === 'text'
                                            ? "border-primary bg-primary/10 shadow-lg scale-105"
                                            : "border-border hover:border-primary/50 hover:bg-accent/30"
                                    )}
                                    onClick={() => setType('text')}
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center",
                                        type === 'text' ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                                    )}>
                                        <FileText size={28} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold">{tCommon('textNote')}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {tWizard('textNoteDesc')}
                                        </p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={cn(
                                        "p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3",
                                        type === 'image'
                                            ? "border-primary bg-primary/10 shadow-lg scale-105"
                                            : "border-border hover:border-primary/50 hover:bg-accent/30"
                                    )}
                                    onClick={() => setType('image')}
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center",
                                        type === 'image' ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                                    )}>
                                        <ImageIcon size={28} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold">{tCommon('image')}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {tWizard('imageDesc')}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Content Input */}
                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                <label className="block text-xs font-medium text-muted-foreground mb-2">
                                    {type === 'text' ? tWizard('textContent') : tWizard('imageContent')}
                                </label>
                                {type === 'text' ? (
                                    <textarea
                                        className="premium-input resize-none"
                                        placeholder={t('enterContent')}
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        rows={8}
                                        autoFocus
                                    />
                                ) : (
                                    <ImageUploadZone
                                        file={file}
                                        onFileChange={handleFileChange}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Time Lock Settings */}
                    {currentStep === 3 && (
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
                    )}

                    {/* Step 4: Preview & Confirm */}
                    {currentStep === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                {tWizard('reviewBeforeSubmit')}
                            </p>

                            {/* Summary Cards */}
                            <div className="space-y-3">
                                {/* Content Type */}
                                <div className="p-4 rounded-lg bg-accent/30 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">{tWizard('contentType')}</p>
                                    <div className="flex items-center gap-2">
                                        {type === 'text' ? <FileText size={16} /> : <ImageIcon size={16} />}
                                        <p className="font-medium">{type === 'text' ? tCommon('textNote') : tCommon('image')}</p>
                                    </div>
                                </div>

                                {/* Title */}
                                {title && (
                                    <div className="p-4 rounded-lg bg-accent/30 border border-border">
                                        <p className="text-xs text-muted-foreground mb-1">{t('itemTitle')}</p>
                                        <p className="font-medium">{title}</p>
                                    </div>
                                )}

                                {/* Content Preview */}
                                <div className="p-4 rounded-lg bg-accent/30 border border-border">
                                    <p className="text-xs text-muted-foreground mb-2">{tWizard('contentPreview')}</p>
                                    {type === 'text' ? (
                                        <p className="text-sm line-clamp-3">{text}</p>
                                    ) : file ? (
                                        <div className="flex items-center gap-2">
                                            <ImageIcon size={16} className="text-primary" />
                                            <span className="text-sm">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Time Lock */}
                                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                    <p className="text-xs text-muted-foreground mb-1">{t('lockDuration')}</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-primary">{unlockTimeInfo.formatted}</p>
                                            <p className="text-xs text-primary/70 mt-0.5">{unlockTimeInfo.remaining}</p>
                                        </div>
                                        <Lock size={20} className="text-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex items-center gap-3">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors flex items-center gap-2"
                            disabled={isSubmitting}
                        >
                            <ChevronLeft size={18} />
                            {tWizard('previousStep')}
                        </button>
                    )}

                    <div className="flex-1" />

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!canProceed(currentStep)}
                            className="premium-button px-6 py-3 rounded-xl text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {tWizard('nextStep')}
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="premium-button px-6 py-3 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                            disabled={isSubmitting || !unlockTimeInfo.isValid}
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
                    )}
                </div>
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
