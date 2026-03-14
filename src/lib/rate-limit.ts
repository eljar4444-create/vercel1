const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const attempts = new Map<string, RateLimitEntry>();

function getFreshEntry(now: number): RateLimitEntry {
    return {
        count: 0,
        resetAt: now + WINDOW_MS,
    };
}

export function checkRateLimit(key: string) {
    const now = Date.now();
    const current = attempts.get(key);
    const entry = !current || current.resetAt <= now ? getFreshEntry(now) : current;

    if (entry.count >= MAX_ATTEMPTS) {
        attempts.set(key, entry);
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    entry.count += 1;
    attempts.set(key, entry);

    return {
        allowed: true,
        remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
        resetAt: entry.resetAt,
    };
}
