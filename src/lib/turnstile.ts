/**
 * Cloudflare Turnstile server-side token verification.
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 3_000;

interface TurnstileResponse {
    success: boolean;
    'error-codes'?: string[];
    challenge_ts?: string;
    hostname?: string;
}

export async function verifyTurnstileToken(
    token: string,
    remoteIp?: string
): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
        // In development without keys, allow through with a warning
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Turnstile] No TURNSTILE_SECRET_KEY set — skipping verification in development');
            return true;
        }
        console.error('[Turnstile] TURNSTILE_SECRET_KEY is not set');
        return false;
    }

    if (!token) {
        return false;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const body: Record<string, string> = {
            secret,
            response: token,
        };
        if (remoteIp) {
            body.remoteip = remoteIp;
        }

        const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[Turnstile] HTTP ${response.status}`);
            return false;
        }

        const data: TurnstileResponse = await response.json();

        if (!data.success) {
            console.warn('[Turnstile] Verification failed:', data['error-codes']);
        }

        return data.success;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error('[Turnstile] Verification timed out');
        } else {
            console.error('[Turnstile] Verification error:', error);
        }
        // Fail closed — reject on error
        return false;
    }
}
