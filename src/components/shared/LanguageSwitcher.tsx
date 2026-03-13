'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const toggleLanguage = () => {
        const nextLocale = locale === 'en' ? 'zh' : 'en';
        const params = new URLSearchParams(searchParams);
        const queryString = params.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;

        startTransition(() => {
            router.replace(url, { locale: nextLocale });
        });
    };

    return (
        <button
            onClick={toggleLanguage}
            disabled={isPending}
            className="btn btn-ghost text-sm"
            title="Switch Language"
        >
            <Languages size={18} />
            <span>{locale === 'en' ? '中文' : 'English'}</span>
        </button>
    );
}
