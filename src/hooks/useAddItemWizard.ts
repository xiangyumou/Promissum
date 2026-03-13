import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { calculateDurationMinutes, calculateUnlockTimeInfo, AbsoluteTime } from '@/core/time';
import { MS_PER_HOUR } from '@/lib/constants';

export type TimeMode = 'duration' | 'absolute';
export type Step = 1 | 2 | 3;

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

    // Step 1: Content (simplified - no type selection)
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    // Step 2: Time settings
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

    // Reset form when modal opens
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

    // File handling
    const addFiles = useCallback((newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Must have at least text or one file
        if (!text.trim() && files.length === 0) return;
        if (!unlockTimeInfo.isValid) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();

            if (timeMode === 'absolute') {
                formData.append('decryptAt', unlockTimeInfo.unlockDate.getTime().toString());
            } else {
                formData.append('durationMinutes', calculatedDuration.toString());
            }

            // Add metadata with title if provided
            if (title.trim()) {
                formData.append('metadata', JSON.stringify({ title: title.trim() }));
            }

            // Add text content
            if (text.trim()) {
                formData.append('text', text);
            }

            // Add all files
            for (const file of files) {
                formData.append('files', file);
            }

            await onSubmit(formData);

            // Reset form
            setCurrentStep(1);
            setTitle('');
            setText('');
            setFiles([]);
            setAccumulatedDuration(defaultDuration);
            setTimeMode('duration');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Paste event handler for files
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isOpen || currentStep !== 1) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            const pastedFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const blob = item.getAsFile();
                    if (blob) {
                        pastedFiles.push(blob);
                    }
                }
            }

            if (pastedFiles.length > 0) {
                addFiles(pastedFiles);
                e.preventDefault();
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, currentStep, addFiles]);

    // Step validation
    const canProceed = useCallback((step: Step): boolean => {
        switch (step) {
            case 1:
                return text.trim().length > 0 || files.length > 0; // Must have content
            case 2:
                return unlockTimeInfo.isValid;
            case 3:
                return true; // Review step
            default:
                return false;
        }
    }, [text, files.length, unlockTimeInfo.isValid]);

    const handleNext = () => {
        if (currentStep < 3 && canProceed(currentStep)) {
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
        title,
        setTitle,
        text,
        setText,
        files,
        addFiles,
        removeFile,
        clearFiles,
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
