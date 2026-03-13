'use client';

import { FileText, ImageIcon, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import ImageUploadZone from '../ImageUploadZone';

interface Step1TypeSelectionProps {
    type: 'text' | 'image';
    setType: (type: 'text' | 'image') => void;
}

export function Step1TypeSelection({ type, setType }: Step1TypeSelectionProps) {
    const tCommon = useTranslations('Common');
    const tWizard = useTranslations('Wizard');

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-6">
                {tWizard('selectContentType')}
            </p>
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    className={cn(
                        "p-6 rounded-lg border transition-all flex flex-col items-center gap-3",
                        type === 'text'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                    onClick={() => setType('text')}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        type === 'text' ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground border border-border"
                    )}>
                        <FileText size={24} />
                    </div>
                    <div className="text-center">
                        <p className="font-medium">{tCommon('textNote')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {tWizard('textNoteDesc')}
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    className={cn(
                        "p-6 rounded-lg border transition-all flex flex-col items-center gap-3",
                        type === 'image'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                    onClick={() => setType('image')}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        type === 'image' ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground border border-border"
                    )}>
                        <ImageIcon size={24} />
                    </div>
                    <div className="text-center">
                        <p className="font-medium">{tCommon('image')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {tWizard('imageDesc')}
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}

interface Step2ContentInputProps {
    type: 'text' | 'image';
    title: string;
    setTitle: (title: string) => void;
    text: string;
    setText: (text: string) => void;
    file: File | null;
    setFile: (file: File | null) => void;
}

export function Step2ContentInput({
    type,
    title,
    setTitle,
    text,
    setText,
    file,
    setFile
}: Step2ContentInputProps) {
    const t = useTranslations('AddModal');
    const tWizard = useTranslations('Wizard');

    return (
        <div className="space-y-4">
            {/* Title Input (Optional) */}
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                    {t('itemTitle')}
                </label>
                <input
                    type="text"
                    className="input"
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
                        className="input resize-none"
                        placeholder={t('enterContent')}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={8}
                        autoFocus
                    />
                ) : (
                    <ImageUploadZone
                        file={file}
                        onFileChange={setFile}
                    />
                )}
            </div>
        </div>
    );
}

interface Step4PreviewProps {
    type: 'text' | 'image';
    title: string;
    text: string;
    file: File | null;
    unlockTimeInfo: {
        isValid: boolean;
        formatted: string;
        remaining: string;
    };
}

export function Step4Preview({
    type,
    title,
    text,
    file,
    unlockTimeInfo
}: Step4PreviewProps) {
    const t = useTranslations('AddModal');
    const tCommon = useTranslations('Common');
    const tWizard = useTranslations('Wizard');

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
                {tWizard('reviewBeforeSubmit')}
            </p>

            {/* Summary Cards */}
            <div className="space-y-3">
                {/* Content Type */}
                <div className="p-4 rounded-lg bg-accent border border-border">
                    <p className="text-xs text-muted-foreground mb-1">{tWizard('contentType')}</p>
                    <div className="flex items-center gap-2">
                        {type === 'text' ? <FileText size={16} className="text-muted-foreground" /> : <ImageIcon size={16} className="text-muted-foreground" />}
                        <p className="font-medium">{type === 'text' ? tCommon('textNote') : tCommon('image')}</p>
                    </div>
                </div>

                {/* Title */}
                {title && (
                    <div className="p-4 rounded-lg bg-accent border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{t('itemTitle')}</p>
                        <p className="font-medium">{title}</p>
                    </div>
                )}

                {/* Content Preview */}
                <div className="p-4 rounded-lg bg-accent border border-border">
                    <p className="text-xs text-muted-foreground mb-2">{tWizard('contentPreview')}</p>
                    {type === 'text' ? (
                        <p className="text-sm line-clamp-3">{text}</p>
                    ) : file ? (
                        <div className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    ) : null}
                </div>

                {/* Time Lock */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-primary/70 mb-1">{t('lockDuration')}</p>
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
    );
}
