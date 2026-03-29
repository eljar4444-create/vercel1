/**
 * Centralized guard: rejects all mutations if the current user is banned.
 * Import and call at the top of every mutation server action.
 */

const BANNED_ERROR = { success: false, error: 'Ваш аккаунт заблокирован.' } as const;

type SessionLike = {
    user?: {
        id?: string;
        isBanned?: boolean;
    };
} | null;

/**
 * Returns an error object if the user is banned, or `null` if they're allowed.
 *
 * Usage:
 * ```ts
 * const banned = checkBanned(session);
 * if (banned) return banned;
 * ```
 */
export function checkBanned(session: SessionLike): { success: false; error: string } | null {
    if (session?.user?.isBanned) {
        return BANNED_ERROR;
    }
    return null;
}
