import { FileText, ImageIcon, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

export default function Step4Preview({
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
