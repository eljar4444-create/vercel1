import { describe, it, expect } from 'vitest';
import { calculateSlots, normalizeDuration } from '@/lib/booking/slots';
import type { TimeInterval } from '@/lib/scheduling';

// ──────────────────────────────────────────────────────────
// Suite 2.1 — normalizeDuration
// ──────────────────────────────────────────────────────────
describe('normalizeDuration', () => {
    it('returns 60 for undefined', () => {
        expect(normalizeDuration(undefined)).toBe(60);
    });

    it('returns 60 for 0 (falsy)', () => {
        expect(normalizeDuration(0)).toBe(60);
    });

    it('returns 60 for NaN (not finite)', () => {
        expect(normalizeDuration(NaN)).toBe(60);
    });

    it('returns 60 for Infinity (not finite)', () => {
        expect(normalizeDuration(Infinity)).toBe(60);
    });

    it('clamps to minimum 15 for value below 15', () => {
        expect(normalizeDuration(10)).toBe(15);
        expect(normalizeDuration(1)).toBe(15);
    });

    it('clamps to maximum 240 for value above 240', () => {
        expect(normalizeDuration(300)).toBe(240);
        expect(normalizeDuration(500)).toBe(240);
    });

    it('passes through valid values', () => {
        expect(normalizeDuration(60)).toBe(60);
        expect(normalizeDuration(30)).toBe(30);
        expect(normalizeDuration(90)).toBe(90);
        expect(normalizeDuration(15)).toBe(15);
        expect(normalizeDuration(240)).toBe(240);
    });

    it('floors floating point values', () => {
        expect(normalizeDuration(90.7)).toBe(90);
        expect(normalizeDuration(60.9)).toBe(60);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 2.2 — calculateSlots (Happy Path)
// ──────────────────────────────────────────────────────────
describe('calculateSlots — happy path', () => {
    const fullDay: TimeInterval[] = [{ start: '10:00', end: '18:00' }];

    it('generates correct 60min slots for a full day with no bookings', () => {
        const slots = calculateSlots(fullDay, 60, []);
        // 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00
        expect(slots).toEqual([
            '10:00', '11:00', '12:00', '13:00',
            '14:00', '15:00', '16:00', '17:00',
        ]);
        expect(slots).toHaveLength(8);
    });

    it('generates correct 30min slots for a full day with no bookings', () => {
        const slots = calculateSlots(fullDay, 30, []);
        expect(slots).toHaveLength(16);
        expect(slots[0]).toBe('10:00');
        expect(slots[slots.length - 1]).toBe('17:30');
    });

    it('handles split schedule (lunch break) correctly', () => {
        const splitDay: TimeInterval[] = [
            { start: '10:00', end: '12:00' },
            { start: '14:00', end: '18:00' },
        ];
        const slots = calculateSlots(splitDay, 60, []);
        // Morning: 10:00, 11:00. Afternoon: 14:00, 15:00, 16:00, 17:00
        expect(slots).toEqual([
            '10:00', '11:00',
            '14:00', '15:00', '16:00', '17:00',
        ]);
        expect(slots).toHaveLength(6);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 2.3 — calculateSlots (Overlap Prevention — CRITICAL)
// ──────────────────────────────────────────────────────────
describe('calculateSlots — overlap prevention (CRITICAL)', () => {
    const fullDay: TimeInterval[] = [{ start: '10:00', end: '18:00' }];

    it('removes slot that is exactly booked', () => {
        const bookings = [{ time: '10:00', service: { duration_min: 60 } }];
        const slots = calculateSlots(fullDay, 60, bookings);
        expect(slots).not.toContain('10:00');
        expect(slots[0]).toBe('11:00');
    });

    it('removes partially overlapping slot (booking at 10:00/60min blocks 10:30 for 60min service)', () => {
        // When using 30-min step size, a 60-min booking at 10:00 occupies 10:00-11:00
        // A 60-min service at 10:30 would occupy 10:30-11:30, overlapping with 10:00-11:00
        const bookings = [{ time: '10:00', service: { duration_min: 60 } }];
        const slots = calculateSlots(fullDay, 30, bookings);
        expect(slots).not.toContain('10:00');
        // 10:30 generates a slot ending at 11:00, booking occupies 10:00-11:00
        // 10:30 < 11:00 (busy.end) AND 11:00 > 10:00 (busy.start) → overlap!
        expect(slots).not.toContain('10:30');
    });

    it('keeps slot immediately after booking ends', () => {
        const bookings = [{ time: '10:00', service: { duration_min: 60 } }];
        const slots = calculateSlots(fullDay, 60, bookings);
        expect(slots).toContain('11:00');
    });

    it('removes multiple booked slots correctly', () => {
        const bookings = [
            { time: '10:00', service: { duration_min: 60 } },
            { time: '14:00', service: { duration_min: 60 } },
        ];
        const slots = calculateSlots(fullDay, 60, bookings);
        expect(slots).not.toContain('10:00');
        expect(slots).not.toContain('14:00');
        expect(slots).toContain('11:00');
        expect(slots).toContain('13:00');
        expect(slots).toContain('15:00');
    });

    it('returns empty array when all slots are booked', () => {
        const bookings = [
            { time: '10:00', service: { duration_min: 60 } },
            { time: '11:00', service: { duration_min: 60 } },
            { time: '12:00', service: { duration_min: 60 } },
            { time: '13:00', service: { duration_min: 60 } },
            { time: '14:00', service: { duration_min: 60 } },
            { time: '15:00', service: { duration_min: 60 } },
            { time: '16:00', service: { duration_min: 60 } },
            { time: '17:00', service: { duration_min: 60 } },
        ];
        const slots = calculateSlots(fullDay, 60, bookings);
        expect(slots).toHaveLength(0);
    });

    it('handles booking with different duration than requested service', () => {
        // Existing booking is 120 minutes (10:00-12:00)
        // Requesting 60 minute slots
        const bookings = [{ time: '10:00', service: { duration_min: 120 } }];
        const slots = calculateSlots(fullDay, 60, bookings);
        expect(slots).not.toContain('10:00');
        expect(slots).not.toContain('11:00');
        expect(slots).toContain('12:00');
    });

    it('handles booking without service (uses serviceDuration fallback)', () => {
        const bookings = [{ time: '10:00', service: null }];
        const slots = calculateSlots(fullDay, 60, bookings);
        // When service is null, normalizeDuration uses the serviceDuration param (60)
        expect(slots).not.toContain('10:00');
        expect(slots).toContain('11:00');
    });
});

// ──────────────────────────────────────────────────────────
// Suite 2.4 — calculateSlots (Edge Cases)
// ──────────────────────────────────────────────────────────
describe('calculateSlots — edge cases', () => {
    it('returns empty for empty work intervals', () => {
        expect(calculateSlots([], 60, [])).toEqual([]);
    });

    it('returns empty when service duration exceeds work interval', () => {
        const shortInterval: TimeInterval[] = [{ start: '10:00', end: '10:30' }];
        const slots = calculateSlots(shortInterval, 60, []);
        expect(slots).toEqual([]);
    });

    it('returns exactly 1 slot when service fills interval exactly', () => {
        const exactInterval: TimeInterval[] = [{ start: '10:00', end: '11:00' }];
        const slots = calculateSlots(exactInterval, 60, []);
        expect(slots).toEqual(['10:00']);
    });

    it('boundary: booking ending at interval boundary does not block next interval slot', () => {
        const splitDay: TimeInterval[] = [
            { start: '10:00', end: '12:00' },
            { start: '12:00', end: '14:00' },
        ];
        const bookings = [{ time: '11:00', service: { duration_min: 60 } }];
        const slots = calculateSlots(splitDay, 60, bookings);
        // 11:00-12:00 is booked. 12:00-13:00 should be available (no overlap).
        expect(slots).toContain('12:00');
    });
});
