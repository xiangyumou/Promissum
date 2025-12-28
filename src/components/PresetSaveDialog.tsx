'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from './ui/Modal';
import { Save } from 'lucide-react';

interface PresetSaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
}

export default function PresetSaveDialog({ isOpen, onClose, onConfirm }: PresetSaveDialogProps) {
    const t = useTranslations('Sidebar');
    const tCommon = useTranslations('Common');
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('savePreset')}
        >
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground pl-1">
                            {t('presetName')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('presetNamePlaceholder')}
                            className="w-full px-4 py-3 rounded-xl bg-accent/50 border-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50 transition-all font-medium"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                        {tCommon('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
                    >
                        <Save size={18} />
                        {tCommon('save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
