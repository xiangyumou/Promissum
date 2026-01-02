/**
 * Unlock Effects Utility
 * 
 * Handles unlock celebrations including sound effects and confetti animations
 */

import confetti from 'canvas-confetti';

/**
 * Play unlock sound effect
 * Uses Web Audio API with fallback for unsupported browsers
 */
async function playUnlockSound(): Promise<void> {
    try {
        const audio = new Audio('/sounds/unlock.mp3');
        audio.volume = 0.5; // 50% volume
        await audio.play();
    } catch (error) {
        console.warn('Failed to play unlock sound:', error);
    }
}

/**
 * Trigger confetti celebration
 * Uses canvas-confetti library
 */
function triggerConfetti(): void {
    try {
        // Fire confetti from both sides
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 9999,
        };

        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        // Multiple bursts with different spreads and speeds
        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        fire(0.2, {
            spread: 60,
        });

        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    } catch (error) {
        console.warn('Failed to trigger confetti:', error);
    }
}

/**
 * Trigger unlock celebration with optional sound and confetti
 * @param options Celebration options
 */
export async function celebrateUnlock(options: {
    sound?: boolean;
    confetti?: boolean;
}): Promise<void> {
    const { sound = false, confetti: showConfetti = true } = options;

    // Trigger effects in parallel
    const promises: Promise<void>[] = [];

    if (sound) {
        promises.push(playUnlockSound());
    }

    if (showConfetti) {
        promises.push(Promise.resolve(triggerConfetti()));
    }

    await Promise.allSettled(promises);
}
