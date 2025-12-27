/**
 * User Context Abstraction Layer
 * 
 * @deprecated This module is no longer actively used since the app now calls
 * a remote API service that handles user authentication via Bearer tokens.
 * 
 * Kept for backward compatibility and potential future client-side user management.
 * 
 * ## Current Mode: Remote API Service
 * - User authentication handled by remote API via Bearer tokens
 * - No local user context needed
 * - Token configured in environment variables
 * 
 * ## Legacy Notes:
 * - Previously used for local single-user mode
 * - Can be repurposed for client-side multi-user session management if needed
 */

/**
 * Get the current user ID
 * 
 * @returns User ID string
 * 
 * @example
 * // Single-user mode (current)
 * const userId = getCurrentUserId(); // Returns 'local'
 * 
 * @example
 * // Multi-user mode (future implementation)
 * const userId = getCurrentUserId(); // Returns actual user ID from session
 */
export function getCurrentUserId(): string {
    // ===== SINGLE-USER MODE =====
    // Always return 'local' for the local single-user
    return 'local';

    // ===== MULTI-USER MODE (Future) =====
    // Uncomment and implement when adding authentication:
    // 
    // import { getServerSession } from 'next-auth';
    // const session = await getServerSession();
    // return session?.user?.id || 'anonymous';
}

/**
 * Check if the current user is authenticated
 * 
 * @returns true if authenticated, false otherwise
 * 
 * @example
 * // Single-user mode (current)
 * const authed = isAuthenticated(); // Always returns true
 * 
 * @example
 * // Multi-user mode (future implementation)
 * const authed = isAuthenticated(); // Returns actual authentication status
 */
export function isAuthenticated(): boolean {
    // ===== SINGLE-USER MODE =====
    // Always authenticated in local mode
    return true;

    // ===== MULTI-USER MODE (Future) =====
    // Uncomment and implement when adding authentication:
    // 
    // import { getServerSession } from 'next-auth';
    // const session = await getServerSession();
    // return !!session?.user;
}

/**
 * Local user constant
 * Used as the default user ID in single-user mode
 */
export const LOCAL_USER_ID = 'local';
