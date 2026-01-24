import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toSnakeCase<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => toSnakeCase(item)) as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = toSnakeCase(value);
    }
    return result as T;
}
