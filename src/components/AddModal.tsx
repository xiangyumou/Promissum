'use client';

import { useState, useRef, useMemo } from 'react';
import Modal from './ui/Modal';
import { cn } from '@/lib/utils';
import {
    Clock,
    FileText,
    Image as ImageIcon,
    Upload,
    RefreshCw,
    Plus,
    Lock,
    AlertCircle
} from 'lucide-react';

interface AddModalProps {
    isOpen: boolean;
    defaultDuration: number;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
}

// Duration presets in minutes
const DURATION_PRESETS = [
    { label: '1m', minutes: 1 },
    { label: '10m', minutes: 10 },
    { label: '1h', minutes: 60 },
    { label: '6h', minutes: 360 },
    { label: '1d', minutes: 1440 },
];

type TimeMode = 'duration' | 'absolute';

export default function AddModal({ isOpen, defaultDuration, onClose, onSubmit }: AddModalProps) {
    const [type, setType] = useState<'text' | 'image'>('text');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [timeMode, setTimeMode] = useState<TimeMode>('duration');
    const [accumulatedDuration, setAccumulatedDuration] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Absolute time state
    const getDefaultAbsoluteTime = () => {
        const d = new Date(Date.now() + 60 * 60 * 1000);
        return {
            year: d.getFullYear().toString().slice(-2),
            month: (d.getMonth() + 1).toString().padStart(2, '0'),
            day: d.getDate().toString().padStart(2, '0'),
            hour: d.getHours().toString().padStart(2, '0'),
            minute: d.getMinutes().toString().padStart(2, '0'),
        };
    };

    const [absoluteTime, setAbsoluteTime] = useState(getDefaultAbsoluteTime);

    // Calculate duration in minutes based on current mode
    const calculatedDuration = useMemo(() => {
        if (timeMode === 'duration') {
            return Math.max(1, accumulatedDuration);
        } else {
            const year = parseInt(absoluteTime.year) + 2000;
            const month = parseInt(absoluteTime.month) - 1;
            const day = parseInt(absoluteTime.day);
            const hour = parseInt(absoluteTime.hour);
            const minute = parseInt(absoluteTime.minute);

            const targetDate = new Date(year, month, day, hour, minute);
            const now = new Date();
            const diffMs = targetDate.getTime() - now.getTime();
            return Math.ceil(diffMs / 60000);
        }
    }, [timeMode, accumulatedDuration, absoluteTime]);

    // Calculate and format the unlock time
    const unlockTimeInfo = useMemo(() => {
        const now = new Date();
        let unlockDate: Date;

        if (timeMode === 'absolute') {
            const year = parseInt(absoluteTime.year) + 2000;
            const month = parseInt(absoluteTime.month) - 1;
            const day = parseInt(absoluteTime.day);
            const hour = parseInt(absoluteTime.hour);
            const minute = parseInt(absoluteTime.minute);
            unlockDate = new Date(year, month, day, hour, minute);
        } else {
            unlockDate = new Date(now.getTime() + calculatedDuration * 60 * 1000);
        }

        const month = (unlockDate.getMonth() + 1).toString().padStart(2, '0');
        const day = unlockDate.getDate().toString().padStart(2, '0');
        const hour = unlockDate.getHours().toString().padStart(2, '0');
        const minute = unlockDate.getMinutes().toString().padStart(2, '0');

        const diffMs = unlockDate.getTime() - now.getTime();
        const totalMinutes = Math.ceil(diffMs / 60000);
        const isValid = totalMinutes >= 1;

        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const mins = totalMinutes % 60;

        let remaining = '';
        if (days > 0) remaining += `${days}d `;
        if (hours > 0) remaining += `${hours}h `;
        remaining += `${mins}m`;

        return {
            formatted: `${month}/${day} ${hour}:${minute}`,
            remaining: isValid ? remaining.trim() : 'Invalid Time',
            isValid: isValid,
            unlockDate: unlockDate
        };
    }, [calculatedDuration, timeMode, absoluteTime]);

    const handlePresetClick = (minutes: number) => {
        setAccumulatedDuration(prev => prev + minutes);
    };

    const handleCustomDurationChange = (value: string) => {
        const num = Math.max(0, parseInt(value) || 0);
        setAccumulatedDuration(num);
    };

    const handleResetDuration = () => {
        setAccumulatedDuration(0);
    };

    const handleAbsoluteTimeChange = (field: keyof typeof absoluteTime, value: string) => {
        setAbsoluteTime(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (type === 'text' && !text.trim()) return;
        if (type === 'image' && !file) return;
        if (!unlockTimeInfo.isValid) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('type', type);

            if (timeMode === 'absolute') {
                formData.append('decryptAt', unlockTimeInfo.unlockDate.getTime().toString());
            } else {
                formData.append('durationMinutes', calculatedDuration.toString());
            }

            if (type === 'text') {
                formData.append('content', text);
            } else if (file) {
                formData.append('file', file);
            }

            await onSubmit(formData);

            // Reset form
            setText('');
            setFile(null);
            setAccumulatedDuration(0);
            setTimeMode('duration');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Encrypted Item"
            className="max-w-[500px]"
        >
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
                {/* Type Selection */}
                <div className="flex bg-black/20 p-1 rounded-xl">
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all",
                            type === 'text'
                                ? "bg-white/10 text-white shadow-inner border border-white/5"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                        )}
                        onClick={() => setType('text')}
                    >
                        <FileText size={16} />
                        Text Note
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all",
                            type === 'image'
                                ? "bg-white/10 text-white shadow-inner border border-white/5"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                        )}
                        onClick={() => setType('image')}
                    >
                        <ImageIcon size={16} />
                        Image
                    </button>
                </div>

                {/* Content Input */}
                <div>
                    {type === 'text' ? (
                        <textarea
                            className="w-full p-4 bg-black/30 border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none text-zinc-200 placeholder-zinc-600"
                            placeholder="Enter your secret content here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={5}
                            autoFocus
                        />
                    ) : (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                className={cn(
                                    "w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors",
                                    file
                                        ? "border-indigo-500/50 bg-indigo-500/10"
                                        : "border-white/10 hover:border-indigo-500/30 hover:bg-white/5"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {file ? (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-indigo-400 truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-indigo-300/70">Click to change</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200">Click to upload image</p>
                                            <p className="text-xs text-zinc-600">PNG, JPG, GIF up to 5MB</p>
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Time Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Clock size={16} />
                            Lock Duration
                        </label>
                        <div className="flex bg-black/20 p-0.5 rounded-lg">
                            <button
                                type="button"
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    timeMode === 'duration' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                                )}
                                onClick={() => setTimeMode('duration')}
                            >
                                Duration
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    timeMode === 'absolute' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                                )}
                                onClick={() => setTimeMode('absolute')}
                            >
                                Custom Date
                            </button>
                        </div>
                    </div>

                    {timeMode === 'duration' ? (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {DURATION_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                                        onClick={() => handlePresetClick(preset.minutes)}
                                    >
                                        <Plus size={10} />
                                        {preset.label}
                                    </button>
                                ))}
                                {accumulatedDuration > 0 && (
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full text-xs font-medium transition-colors flex items-center gap-1 border border-red-500/20"
                                        onClick={handleResetDuration}
                                    >
                                        <RefreshCw size={10} />
                                        Reset
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={accumulatedDuration || ''}
                                    placeholder="0"
                                    onChange={(e) => handleCustomDurationChange(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 bg-black/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-lg text-white"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">min</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2 p-3 bg-black/30 rounded-xl border border-white/5">
                            {/* Date Inputs */}
                            <div className="flex items-center gap-1">
                                <TimeInput
                                    value={absoluteTime.year}
                                    onChange={(v) => handleAbsoluteTimeChange('year', v)}
                                    placeholder="YY"
                                />
                                <span className="text-zinc-600">/</span>
                                <TimeInput
                                    value={absoluteTime.month}
                                    onChange={(v) => handleAbsoluteTimeChange('month', v)}
                                    placeholder="MM"
                                />
                                <span className="text-zinc-600">/</span>
                                <TimeInput
                                    value={absoluteTime.day}
                                    onChange={(v) => handleAbsoluteTimeChange('day', v)}
                                    placeholder="DD"
                                />
                            </div>
                            <span className="text-zinc-500">@</span>
                            {/* Time Inputs */}
                            <div className="flex items-center gap-1">
                                <TimeInput
                                    value={absoluteTime.hour}
                                    onChange={(v) => handleAbsoluteTimeChange('hour', v)}
                                    placeholder="HH"
                                />
                                <span className="text-zinc-600">:</span>
                                <TimeInput
                                    value={absoluteTime.minute}
                                    onChange={(v) => handleAbsoluteTimeChange('minute', v)}
                                    placeholder="MM"
                                />
                            </div>
                        </div>
                    )}

                    {/* Unlock Preview */}
                    <div className={cn(
                        "rounded-xl p-4 flex items-center justify-between border transition-all duration-300",
                        unlockTimeInfo.isValid
                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-200"
                            : "bg-red-500/10 border-red-500/20 text-red-200"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-full",
                                unlockTimeInfo.isValid ? "bg-indigo-500/20 text-indigo-400" : "bg-red-500/20 text-red-400"
                            )}>
                                {unlockTimeInfo.isValid ? <Lock size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                                    {unlockTimeInfo.isValid ? "Unlocks at" : "Invalid Time"}
                                </p>
                                <p className="text-lg font-bold font-mono tracking-tight">
                                    {unlockTimeInfo.isValid ? unlockTimeInfo.formatted : "Check Input"}
                                </p>
                            </div>
                        </div>
                        {unlockTimeInfo.isValid && (
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Remaining</p>
                                <p className="text-sm font-medium">{unlockTimeInfo.remaining}</p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.99]"
                    disabled={isSubmitting || (type === 'text' ? !text.trim() : !file) || !unlockTimeInfo.isValid}
                >
                    {isSubmitting ? (
                        <>
                            <RefreshCw size={18} className="animate-spin" />
                            Encrypting...
                        </>
                    ) : (
                        <>
                            <Lock size={18} />
                            Encrypt & Save
                        </>
                    )}
                </button>
            </form>
        </Modal>
    );
}

function TimeInput({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder: string }) {
    return (
        <input
            type="text"
            maxLength={2}
            className="w-10 p-1 text-center bg-transparent border-b-2 border-white/10 focus:border-indigo-500 focus:outline-none font-mono font-medium rounded text-lg text-white placeholder-zinc-700 transition-colors"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
            onFocus={(e) => e.target.select()}
        />
    );
}
