'use client';

import { useState, useCallback } from 'react';
import { initBooking } from '@/app/actions/initBooking';
import { useTurnstile } from '@/hooks/useTurnstile';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

/**
 * Shared hook encapsulating the OTP booking flow:
 *   1. Turnstile verification
 *   2. initBooking server action (slot lock + OTP dispatch)
 *   3. OTP modal state management
 *   4. Cleanup / retry helpers
 *
 * Used by both BookingStandalone and BookingModal.
 */

interface UseBookingOtpOptions {
    onNavigateAfterClose?: () => void;
}

interface SubmitParams {
    profileId: number;
    staffId: string | null;
    serviceId: number | null;
    serviceDuration: number;
    date: string;
    time: string;
    userName: string;
    userPhone: string;
    userEmail: string;
}

export function useBookingOtp(options?: UseBookingOtpOptions) {
    const t = useTranslations('booking');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
    const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
    const [showOtpModal, setShowOtpModal] = useState(false);

    const { token: turnstileToken, containerRef: turnstileRef, resetToken, isReady: turnstileReady } = useTurnstile();

    /**
     * Validate email format (basic client-side check).
     */
    const isValidEmail = useCallback((email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }, []);

    /**
     * Submit the booking form — calls initBooking, opens OTP modal on success.
     */
    const submitBooking = useCallback(async (params: SubmitParams): Promise<boolean> => {
        if (!params.userEmail || !isValidEmail(params.userEmail)) {
            toast.error(t('toasts.invalidEmail'));
            return false;
        }

        if (!turnstileToken) {
            toast.error(t('toasts.turnstileNotReady'));
            return false;
        }

        setIsSubmitting(true);
        try {
            const result = await initBooking({
                ...params,
                userName: params.userName.trim(),
                userEmail: params.userEmail.trim(),
                turnstileToken,
            });

            if (result.success && result.otpSessionId) {
                setOtpSessionId(result.otpSessionId);
                setOtpExpiresAt(result.expiresAt || null);
                setShowOtpModal(true);
                toast.success(t('toasts.otpSent'));
                return true;
            } else {
                toast.error(result.error || t('toasts.bookingError'));
                resetToken();
                return false;
            }
        } catch (_) {
            toast.error(t('toasts.serverError'));
            resetToken();
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [turnstileToken, resetToken, isValidEmail, t]);

    /**
     * Called when OTP is verified — booking has been promoted to PENDING.
     */
    const handleOtpSuccess = useCallback((_bookingId: number) => {
        // Don't navigate — let the user see the success state + password nudge
    }, []);

    /**
     * Called when the 10-min lock expires before OTP verification.
     */
    const handleOtpExpired = useCallback(() => {
        setShowOtpModal(false);
        setOtpSessionId(null);
        toast.error(t('toasts.reservationExpired'));
        resetToken();
    }, [resetToken, t]);

    /**
     * Called when the user closes the OTP modal (success or dismiss).
     */
    const handleOtpClose = useCallback(() => {
        setShowOtpModal(false);
        options?.onNavigateAfterClose?.();
    }, [options]);

    /**
     * Reset the entire OTP flow (for retry / new booking).
     */
    const resetOtp = useCallback(() => {
        setOtpSessionId(null);
        setOtpExpiresAt(null);
        setShowOtpModal(false);
        resetToken();
    }, [resetToken]);

    return {
        // State
        isSubmitting,
        showOtpModal,
        otpSessionId,
        otpExpiresAt,
        turnstileReady,

        // Refs
        turnstileRef,

        // Actions
        submitBooking,
        handleOtpSuccess,
        handleOtpExpired,
        handleOtpClose,
        resetOtp,
        isValidEmail,
    };
}
