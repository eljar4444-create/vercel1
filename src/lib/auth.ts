/**
 * Client-side JWT auth utilities (Stateless, no cookies).
 *
 * Usage:
 *   import { saveToken, getToken, removeToken, getAuthHeaders } from '@/lib/auth';
 *
 *   // After login/register:
 *   saveToken(response.token);
 *
 *   // For protected API calls:
 *   fetch('/api/protected', { headers: getAuthHeaders() });
 *
 *   // Logout:
 *   removeToken();
 */

const TOKEN_KEY = 'auth_token';

/** Save JWT token to localStorage */
export function saveToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

/** Get JWT token from localStorage */
export function getToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
}

/** Remove JWT token (logout) */
export function removeToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
    }
}

/** Get Authorization headers for fetch requests */
export function getAuthHeaders(): Record<string, string> {
    const token = getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

/** Decode JWT payload without verification (for UI display only) */
export function parseTokenPayload(): {
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
} | null {
    const token = getToken();
    if (!token) return null;

    try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        return payload;
    } catch {
        return null;
    }
}

/** Check if the stored token is expired */
export function isTokenExpired(): boolean {
    const payload = parseTokenPayload();
    if (!payload) return true;
    return Date.now() >= payload.exp * 1000;
}
