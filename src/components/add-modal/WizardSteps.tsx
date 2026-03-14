'use client';

import { FileText, Lock, Layers, File, Image } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FileUploadZone from '../FileUploadZone';

// Icon component that renders the appropriate icon based on content type
function ContentTypeIcon({ files, hasText, size, className }: { files: File[]; hasText: boolean; size?: number; className?: string }) {
    if (hasText && files.length > 0) return <Layers size={size} className={className} />;
    if (hasText) return <FileText size={size} className={className} />;
    if (files.length === 0) return <File size={size} className={className} />;
    if (files.length === 1 && files[0].type.startsWith('image/')) return <Image size={size} className={className} />;
    return <File size={size} className={className} />;
}

interface Step1ContentInputProps {
    title: string;
    setTitle: (title: string) => void;
    text: string;
    setText: (text: string) => void;
    files: File[];
    onFilesChange: (files: File[]) => void;
}

export function Step1ContentInput({
    title,
    setTitle,
    text,
    setText,
    files,
    onFilesChange
}: Step1ContentInputProps) {
    const t = useTranslations('AddModal');
    const tWizard = useTranslations('Wizard');

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
                {tWizard('addContentDesc')}
            </p>

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

            {/* Text Input */}
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                    {tWizard('textContent')} <span className="text-muted-foreground/50">({tWizard('optional')})</span>
                </label>
                <textarea
                    className="input resize-none"
                    placeholder={t('enterContent')}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                />
            </div>

            {/* File Upload */}
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                    {tWizard('files')} <span className="text-muted-foreground/50">({tWizard('optional')})</span>
                </label>
                <FileUploadZone
                    files={files}
                    onFilesChange={onFilesChange}
                />
            </div>
        </div>
    );
}

interface Step3PreviewProps {
    title: string;
    text: string;
    files: File[];
    unlockTimeInfo: {
        isValid: boolean;
        formatted: string;
        remaining: string;
    };
}

export function Step3Preview({
    title,
    text,
    files,
    unlockTimeInfo
}: Step3PreviewProps) {
    const t = useTranslations('AddModal');
    const tCommon = useTranslations('Common');
    const tWizard = useTranslations('Wizard');

    const hasText = text.trim().length > 0;

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
                        <ContentTypeIcon files={files} hasText={hasText} size={16} className="text-muted-foreground" />
                        <p className="font-medium">
                            {hasText && files.length > 0 && tWizard('mixedContent')}
                            {hasText && files.length === 0 && tCommon('text')}
                            {!hasText && files.length > 0 && tWizard('files', { count: files.length })}
                        </p>
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
                    {hasText && (
                        <p className="text-sm line-clamp-3 mb-2">{text}</p>
                    )}
                    {files.length > 0 && (
                        <div className="space-y-1">
                            {files.slice(0, 3).map((file, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <File size={14} className="text-muted-foreground" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                            ))}
                            {files.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                    +{files.length - 3} {tWizard('moreFiles')}
                                </p>
                            )}
                        </div>
                    )}
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
