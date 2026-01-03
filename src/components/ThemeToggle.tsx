'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useHasMounted } from '@/hooks/useHasMounted';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const t = useTranslations('Theme');
    const mounted = useHasMounted();

    if (!mounted) {
        return <div className="w-[104px] h-[36px] bg-white/5 rounded-lg animate-pulse" />;
    }

    return (
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
            <button
                className={`flex-1 p-1.5 rounded-lg transition-all flex items-center justify-center ${theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setTheme('light')}
                title={t('light')}
            >
                <Sun size={16} />
            </button>
            <button
                className={`flex-1 p-1.5 rounded-lg transition-all flex items-center justify-center ${theme === 'system' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setTheme('system')}
                title={t('system')}
            >
                <Monitor size={16} />
            </button>
            <button
                className={`flex-1 p-1.5 rounded-lg transition-all flex items-center justify-center ${theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setTheme('dark')}
                title={t('dark')}
            >
                <Moon size={16} />
            </button>
        </div>
    );
}
