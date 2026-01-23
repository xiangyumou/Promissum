'use client';

import { useState, useMemo, useEffect } from 'react';
import Modal from './ui/Modal';
import { cn } from '@/lib/utils';
import {
    RefreshCw,
    Lock,
    ChevronLeft,
    ChevronRight,
    Check
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { timeService } from '@/lib/services/time-service';
import { calculateDurationMinutes, calculateUnlockTimeInfo } from '@/lib/utils/unlock-time';
import Step1TypeSelection from './add-modal/Step1TypeSelection';
import Step2ContentInput from './add-modal/Step2ContentInput';
import Step3TimeSettings from './add-modal/Step3TimeSettings';
import Step4Preview from './add-modal/Step4Preview';

interface AddModalProps {
    isOpen: boolean;
    defaultDuration: number;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
}

export type TimeMode = 'duration' | 'absolute';
export type Step = 1 | 2 | 3 | 4;

export default function AddModal({ isOpen, defaultDuration, onClose, onSubmit }: AddModalProps) {
    const t = useTranslations('AddModal');
    const tWizard = useTranslations('Wizard');

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

        // Determine the specific error message based on errorReason
        let errorMessage: string | null = null;
        if (!info.isValid) {
            if (info.errorReason === 'past') {
                errorMessage = t('timePast');
            } else if (info.errorReason === 'incomplete') {
                errorMessage = t('timeIncomplete');
            } else {
                errorMessage = t('invalidTime');
            }
        }

        return {
            ...info,
            remaining: info.isValid ? info.remaining : errorMessage || t('invalidTime'),
            errorMessage,
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
                                                : "bg-primary/20 text-primary/60 cursor-not-allowed border-2 border-primary/30"
                                    )}
                                >
                                    {step < currentStep ? <Check size={18} /> : step}
                                </button>
                                {step < 4 && (
                                    <div className={cn(
                                        "flex-1 h-1 mx-2 rounded-full transition-all",
                                        step < currentStep ? "bg-primary" : "bg-primary/30"
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
                        <Step1TypeSelection type={type} setType={setType} />
                    )}

                    {/* Step 2: Content Input */}
                    {currentStep === 2 && (
                        <Step2ContentInput
                            type={type}
                            title={title}
                            setTitle={setTitle}
                            text={text}
                            setText={setText}
                            file={file}
                            setFile={setFile}
                        />
                    )}

                    {/* Step 3: Time Lock Settings */}
                    {currentStep === 3 && (
                        <Step3TimeSettings
                            timeMode={timeMode}
                            setTimeMode={setTimeMode}
                            accumulatedDuration={accumulatedDuration}
                            setAccumulatedDuration={setAccumulatedDuration}
                            absoluteTime={absoluteTime}
                            setAbsoluteTime={setAbsoluteTime}
                            handleAbsoluteTimeChange={handleAbsoluteTimeChange}
                            handlePresetClick={handlePresetClick}
                            handleCustomDurationChange={handleCustomDurationChange}
                            handleResetDuration={handleResetDuration}
                            unlockTimeInfo={unlockTimeInfo}
                            defaultDuration={defaultDuration}
                        />
                    )}

                    {/* Step 4: Preview & Confirm */}
                    {currentStep === 4 && (
                        <Step4Preview
                            type={type}
                            title={title}
                            text={text}
                            file={file}
                            unlockTimeInfo={unlockTimeInfo}
                        />
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
