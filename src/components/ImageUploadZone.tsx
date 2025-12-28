'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ImageUploadZoneProps {
    file: File | null;
    onFileChange: (file: File | null) => void;
    disabled?: boolean;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
};

export default function ImageUploadZone({ file, onFileChange, disabled = false }: ImageUploadZoneProps) {
    const t = useTranslations('ImageUpload');
    const tCommon = useTranslations('Common');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileChange(acceptedFiles[0]);
        }
    }, [onFileChange]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: ACCEPTED_IMAGE_TYPES,
        maxSize: MAX_FILE_SIZE,
        multiple: false,
        disabled,
        noClick: false,
        noKeyboard: false
    });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
    };

    // Get error message if any
    const getErrorMessage = () => {
        if (fileRejections.length > 0) {
            const rejection = fileRejections[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                return t('fileTooLarge');
            }
            if (rejection.errors[0]?.code === 'file-invalid-type') {
                return t('invalidFileType');
            }
            return rejection.errors[0]?.message;
        }
        return null;
    };

    const errorMessage = getErrorMessage();

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl transition-all cursor-pointer",
                    "flex flex-col items-center justify-center gap-3",
                    isDragActive && !disabled
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : file
                            ? "border-primary/50 bg-primary/5 h-40"
                            : "border-border hover:border-primary/30 hover:bg-accent/30 h-40",
                    disabled && "opacity-50 cursor-not-allowed",
                    errorMessage && "border-destructive/50 bg-destructive/5"
                )}
            >
                <input {...getInputProps()} />

                {file ? (
                    <>
                        {/* File Preview */}
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <ImageIcon size={24} />
                        </div>
                        <div className="text-center px-4">
                            <p className="text-sm font-medium text-primary truncate max-w-[250px]">
                                {file.name}
                            </p>
                            <p className="text-xs text-primary/70 mt-1">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                        </div>

                        {/* Remove button */}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                                aria-label={tCommon('delete')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {/* Upload prompt */}
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                            isDragActive
                                ? "bg-primary/20 text-primary"
                                : "bg-accent text-muted-foreground"
                        )}>
                            <Upload size={24} />
                        </div>
                        <div className="text-center px-4">
                            <p className={cn(
                                "text-sm font-medium transition-colors",
                                isDragActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}>
                                {isDragActive ? t('dropHere') : t('dragDropHere')}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                {t('orClickToSelect')}
                            </p>
                            <p className="text-xs text-muted-foreground/50 mt-2">
                                PNG, JPG, GIF, WEBP • {t('maxSize', { size: '5MB' })}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Error message */}
            {errorMessage && (
                <div className="text-sm text-destructive flex items-center gap-2 px-2">
                    <span className="text-xs">⚠️</span>
                    {errorMessage}
                </div>
            )}

            {/* Paste hint */}
            {!file && !disabled && (
                <p className="text-xs text-muted-foreground/60 text-center">
                    💡 {t('pasteHint')}
                </p>
            )}
        </div>
    );
}
