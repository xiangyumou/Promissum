import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { calculateDurationMinutes, calculateUnlockTimeInfo, AbsoluteTime } from '@/core/time';
import { MS_PER_HOUR } from '@/lib/constants';

export type TimeMode = 'duration' | 'absolute';
export type Step = 1 | 2 | 3 | 4;

interface UseAddItemWizardProps {
    isOpen: boolean;
    defaultDuration: number;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
}

export function useAddItemWizard({ isOpen, defaultDuration, onClose, onSubmit }: UseAddItemWizardProps) {
    const t = useTranslations('AddModal');

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

    // Absolute time state
    const getDefaultAbsoluteTime = () => {
        const d = new Date(Date.now() + MS_PER_HOUR);
        return {
            year: d.getFullYear().toString().slice(-2),
            month: (d.getMonth() + 1).toString().padStart(2, '0'),
            day: d.getDate().toString().padStart(2, '0'),
            hour: d.getHours().toString().padStart(2, '0'),
            minute: d.getMinutes().toString().padStart(2, '0'),
        };
    };

    const [absoluteTime, setAbsoluteTime] = useState<AbsoluteTime>(getDefaultAbsoluteTime);

    // Reset duration and step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setAccumulatedDuration(defaultDuration);
            setTimeMode('duration');
        }
    }, [isOpen, defaultDuration]);

    // Calculate duration in minutes based on current mode
    const calculatedDuration = useMemo(() => {
        return calculateDurationMinutes(timeMode, accumulatedDuration, absoluteTime, Date.now());
    }, [timeMode, accumulatedDuration, absoluteTime]);

    // Calculate and format the unlock time
    const unlockTimeInfo = useMemo(() => {
        const info = calculateUnlockTimeInfo(calculatedDuration, timeMode, absoluteTime, Date.now());

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

    const handleAbsoluteTimeChange = (field: string, value: string) => {
        setAbsoluteTime(prev => ({ ...prev, [field as keyof typeof absoluteTime]: value }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

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
    const canProceed = useCallback((step: Step): boolean => {
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
    }, [type, text, file, unlockTimeInfo.isValid]);

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

    return {
        currentStep,
        type,
        setType,
        title,
        setTitle,
        text,
        setText,
        file,
        setFile,
        timeMode,
        setTimeMode,
        accumulatedDuration,
        setAccumulatedDuration,
        absoluteTime,
        setAbsoluteTime,
        unlockTimeInfo,
        isSubmitting,
        canProceed,
        handleNext,
        handleBack,
        handleStepClick,
        handleSubmit,
        handlePresetClick,
        handleCustomDurationChange,
        handleResetDuration,
        handleAbsoluteTimeChange
    };
}
