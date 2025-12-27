'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const t = useTranslations('Theme');
    const [mounted, setMounted] = useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-[104px] h-[36px] bg-white/5 rounded-lg animate-pulse" />;
    }

    return (
        <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
            <button
                className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => setTheme('light')}
                title={t('light')}
            >
                <Sun size={16} />
            </button>
            <button
                className={`p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => setTheme('system')}
                title={t('system')}
            >
                <Monitor size={16} />
            </button>
            <button
                className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => setTheme('dark')}
                title={t('dark')}
            >
                <Moon size={16} />
            </button>
        </div>
    );
}
