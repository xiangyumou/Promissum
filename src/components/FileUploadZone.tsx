'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, FileText, Film, Music, Archive, File as FileIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    disabled?: boolean;
}

// Constants
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total

// Get icon based on file type
function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType === 'application/pdf') return FileText;
    if (['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(mimeType)) {
        return Archive;
    }
    if (mimeType.startsWith('text/')) return FileText;
    return FileIcon;
}

export default function FileUploadZone({ files, onFilesChange, disabled = false }: FileUploadZoneProps) {
    const t = useTranslations('FileUpload');
    const tCommon = useTranslations('Common');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Calculate total size
        const currentSize = files.reduce((sum, f) => sum + f.size, 0);
        const newSize = acceptedFiles.reduce((sum, f) => sum + f.size, 0);

        if (currentSize + newSize > MAX_TOTAL_SIZE) {
            // Would exceed limit, but we'll let the API handle the error
            // Just add files and let validation happen later
        }

        onFilesChange([...files, ...acceptedFiles]);
    }, [files, onFilesChange]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        multiple: true,
        disabled,
        noClick: false,
        noKeyboard: false
    });

    const handleRemove = (index: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFilesChange([]);
    };

    // Calculate total size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const isOverLimit = totalSize > MAX_TOTAL_SIZE;

    // Get error message if any
    const getErrorMessage = () => {
        if (fileRejections.length > 0) {
            const rejection = fileRejections[0];
            return rejection.errors[0]?.message;
        }
        if (isOverLimit) {
            return t('totalSizeExceeded', { size: '10MB' });
        }
        return null;
    };

    const errorMessage = getErrorMessage();

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                    "flex flex-col items-center justify-center gap-3 p-6",
                    isDragActive && !disabled
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30 hover:bg-accent",
                    disabled && "opacity-50 cursor-not-allowed",
                    errorMessage && "border-destructive/50 bg-destructive/5"
                )}
            >
                <input {...getInputProps()} />

                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    isDragActive
                        ? "bg-primary/20 text-primary"
                        : "bg-accent text-muted-foreground border border-border"
                )}>
                    <Upload size={24} />
                </div>
                <div className="text-center">
                    <p className={cn(
                        "text-sm font-medium",
                        isDragActive ? "text-primary" : "text-muted-foreground"
                    )}>
                        {isDragActive ? t('dropHere') : t('dragDropHere')}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        {t('orClickToSelect')}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-2">
                        {t('maxTotalSize', { size: '10MB' })}
                    </p>
                </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {t('filesSelected', { count: files.length })}
                        </span>
                        <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={disabled}
                            className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                        >
                            {t('clearAll')}
                        </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {files.map((file, index) => {
                            const Icon = getFileIcon(file.type);
                            return (
                                <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center gap-2 p-2 rounded bg-accent border border-border group"
                                >
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon size={16} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={handleRemove(index)}
                                            className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                            aria-label={tCommon('delete')}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Total size indicator */}
                    <div className={cn(
                        "text-xs text-right",
                        isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                        {t('totalSize', { size: (totalSize / 1024 / 1024).toFixed(2) + 'MB' })}
                    </div>
                </div>
            )}

            {/* Error message */}
            {errorMessage && (
                <div className="text-sm text-destructive flex items-center gap-2 px-2">
                    <span className="text-xs">⚠️</span>
                    {errorMessage}
                </div>
            )}

            {/* Paste hint */}
            {files.length === 0 && !disabled && (
                <p className="text-xs text-muted-foreground/60 text-center">
                    {t('pasteHint')}
                </p>
            )}
        </div>
    );
}
