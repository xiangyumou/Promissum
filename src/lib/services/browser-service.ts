/**
 * Browser Service
 *
 * Abstraction layer for browser-specific APIs to facilitate testing.
 * Handles window, storage, and other DOM APIs safely.
 */

export interface IBrowserService {
    isAvailable: boolean;
    localStorage: Storage | null;
    sessionStorage: Storage | null;
    matchMedia(query: string): MediaQueryList | null;
    addWindowListener<K extends keyof WindowEventMap>(
        type: K,
        listener: (this: Window, ev: WindowEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): () => void;
}

const isBrowser = typeof window !== 'undefined';

export const browserService: IBrowserService = {
    isAvailable: isBrowser,

    get localStorage() {
        return isBrowser ? window.localStorage : null;
    },

    get sessionStorage() {
        return isBrowser ? window.sessionStorage : null;
    },

    matchMedia(query: string) {
        if (!isBrowser || !window.matchMedia) return null;
        return window.matchMedia(query);
    },

    addWindowListener(type, listener, options) {
        if (!isBrowser) return () => { };
        window.addEventListener(type, listener, options);
        return () => window.removeEventListener(type, listener, options);
    },
};
