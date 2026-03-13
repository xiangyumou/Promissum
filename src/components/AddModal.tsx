'use client';

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
import Step3TimeSettings from './add-modal/Step3TimeSettings';
import { Step1TypeSelection, Step2ContentInput, Step4Preview } from './add-modal/WizardSteps';
import { useAddItemWizard, Step } from '@/hooks/useAddItemWizard';

interface AddModalProps {
    isOpen: boolean;
    defaultDuration: number;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
}

export default function AddModal(props: AddModalProps) {
    const { isOpen, onClose } = props;
    const t = useTranslations('AddModal');
    const tWizard = useTranslations('Wizard');

    const wizard = useAddItemWizard(props);

    const {
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
    } = wizard;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            className="md:max-w-[550px]"
        >
            <form onSubmit={handleSubmit} className="p-6 pt-2">
                {/* Progress Indicator - Minimal */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <button
                                    type="button"
                                    onClick={() => handleStepClick(step as Step)}
                                    disabled={step > currentStep}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                        step < currentStep
                                            ? "bg-primary text-primary-foreground"
                                            : step === currentStep
                                                ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                                                : "bg-accent text-muted-foreground border border-border"
                                    )}
                                >
                                    {step < currentStep ? <Check size={16} /> : step}
                                </button>
                                {step < 4 && (
                                    <div className={cn(
                                        "flex-1 h-0.5 mx-2 rounded-full transition-colors",
                                        step < currentStep ? "bg-primary" : "bg-border"
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
                <div className="min-h-[280px]">
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
                            defaultDuration={props.defaultDuration}
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
                            className="btn btn-secondary"
                            disabled={isSubmitting}
                        >
                            <ChevronLeft size={16} />
                            {tWizard('previousStep')}
                        </button>
                    )}

                    <div className="flex-1" />

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!canProceed(currentStep)}
                            className="btn btn-primary"
                        >
                            {tWizard('nextStep')}
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !unlockTimeInfo.isValid}
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
                    )}
                </div>
            </form>
        </Modal>
    );
}
