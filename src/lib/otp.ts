/**
 * OTP generation, hashing, and verification utilities.
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const OTP_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Returns both the plaintext (for emailing) and the bcrypt hash (for storage).
 */
export async function generateOtp(): Promise<{ plaintext: string; hash: string }> {
    // Generate a random number between 100000 and 999999
    const randomBytes = crypto.randomBytes(4);
    const num = randomBytes.readUInt32BE(0);
    const plaintext = String(100_000 + (num % 900_000));

    const hash = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);

    return { plaintext, hash };
}

/**
 * Verify a plaintext OTP against a bcrypt hash.
 */
export async function verifyOtp(plaintext: string, hash: string): Promise<boolean> {
    if (!plaintext || !hash) return false;

    // Sanitize input: must be exactly 6 digits
    const sanitized = plaintext.trim();
    if (!/^\d{6}$/.test(sanitized)) return false;

    return bcrypt.compare(sanitized, hash);
}

/**
 * OTP expiry duration in minutes.
 */
export const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

/**
 * Maximum verification attempts per OTP.
 */
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

/**
 * Maximum OTPs that can be sent to a single email per hour.
 */
export const OTP_MAX_PER_HOUR = Number(process.env.OTP_MAX_PER_HOUR) || 5;
