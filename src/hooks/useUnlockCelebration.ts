import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/stores/settings-store';
import { ApiItemDetail } from '@/lib/types';

/**
 * Hook to manage unlock celebrations (confetti + sound)
 * Triggers when an item transitions from locked to unlocked state
 */
export function useUnlockCelebration(item?: ApiItemDetail) {
    const { enableUnlockSound, enableUnlockConfetti } = useSettings();
    const [wasLocked, setWasLocked] = useState(true);

    useEffect(() => {
        if (!item) return;

        const isNowUnlocked = Date.now() >= item.decrypt_at;

        // Trigger unlock effects when transitioning from locked to unlocked
        if (wasLocked && isNowUnlocked) {
            // Dynamic import to avoid SSR issues
            import('@/lib/utils/unlock-effects').then(({ celebrateUnlock }) => {
                celebrateUnlock({
                    sound: enableUnlockSound,
                    confetti: enableUnlockConfetti,
                });
            });
        }

        setWasLocked(!isNowUnlocked);
    }, [item, wasLocked, enableUnlockSound, enableUnlockConfetti]);
}
