/**
 * E.164 phone number validation.
 * Enforces international format: +{country_code}{subscriber_number}
 *
 * Examples:
 *   +491234567890  ✓
 *   +380501234567  ✓
 *   +71234567890   ✓
 *   01234567890    ✗
 *   +49 123 456    ✗ (spaces not allowed)
 */

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Validate a phone number against E.164 format.
 */
export function isValidE164(phone: string): boolean {
    if (!phone) return false;
    return E164_REGEX.test(phone.trim());
}

/**
 * Sanitize a phone input to E.164 by stripping common formatting characters.
 * Does NOT attempt country-code guessing — requires the + prefix.
 */
export function sanitizePhone(phone: string): string {
    // Remove spaces, dashes, parentheses, dots
    return phone.replace(/[\s\-().]/g, '').trim();
}

/**
 * Validate and sanitize in one step. Returns null if invalid.
 */
export function validateAndSanitizePhone(phone: string): string | null {
    const sanitized = sanitizePhone(phone);
    return isValidE164(sanitized) ? sanitized : null;
}
