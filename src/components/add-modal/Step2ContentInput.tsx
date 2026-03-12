import { useTranslations } from 'next-intl';
import ImageUploadZone from '../ImageUploadZone';

interface Step2ContentInputProps {
    type: 'text' | 'image';
    title: string;
    setTitle: (title: string) => void;
    text: string;
    setText: (text: string) => void;
    file: File | null;
    setFile: (file: File | null) => void;
}

export default function Step2ContentInput({
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
