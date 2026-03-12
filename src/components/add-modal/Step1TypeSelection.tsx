import { FileText, ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Step1TypeSelectionProps {
    type: 'text' | 'image';
    setType: (type: 'text' | 'image') => void;
}

export default function Step1TypeSelection({ type, setType }: Step1TypeSelectionProps) {
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
