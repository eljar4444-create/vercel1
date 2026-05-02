'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Loader2, X, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { verifyOtpAndCommit } from '@/app/actions/verifyOtpAndCommit';
import { setPasswordForShadow } from '@/app/actions/setPasswordForShadow';
import { useTranslations } from 'next-intl';

interface OtpModalProps {
    isOpen: boolean;
    onClose: () => void;
    otpSessionId: string;
    email: string;
    expiresAt: string;
    onSuccess: (bookingId: number) => void;
    onExpired: () => void;
}

type ModalState = 'otp' | 'verifying' | 'success' | 'saving-password';

export function OtpModal({
    isOpen,
    onClose,
    otpSessionId,
    email,
    expiresAt,
    onSuccess,
    onExpired,
}: OtpModalProps) {
    const t = useTranslations('booking');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [modalState, setModalState] = useState<ModalState>('otp');
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [bookingId, setBookingId] = useState<number | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Password nudge state
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSaved, setPasswordSaved] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen || !expiresAt) return;

        const update = () => {
            const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
            setSecondsLeft(remaining);
            if (remaining <= 0) {
                onExpired();
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [isOpen, expiresAt, onExpired]);

    // Auto-focus first input
    useEffect(() => {
        if (isOpen && modalState === 'otp') {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen, modalState]);

    const handleDigitChange = useCallback((index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];

        if (value.length > 1) {
            // Handle paste of full code
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            digits.forEach((d, i) => {
                if (i < 6) newCode[i] = d;
            });
            setCode(newCode);
            const lastFilledIndex = Math.min(digits.length - 1, 5);
            inputRefs.current[lastFilledIndex]?.focus();
            return;
        }

        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [code]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [code]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newCode = [...code];
            pasted.split('').forEach((d, i) => {
                if (i < 6) newCode[i] = d;
            });
            setCode(newCode);
            const lastIndex = Math.min(pasted.length - 1, 5);
            inputRefs.current[lastIndex]?.focus();
        }
    }, [code]);

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError(t('otp.errors.enterAllDigits'));
            return;
        }

        setModalState('verifying');
        setError(null);

        const result = await verifyOtpAndCommit({
            otpSessionId,
            code: fullCode,
        });

        if (result.success) {
            setBookingId(result.bookingId || null);
            setUserId(result.userId || null);
            setModalState('success');
            if (result.bookingId) {
                onSuccess(result.bookingId);
            }
        } else {
            setError(result.error || t('otp.errors.verify'));
            if (typeof result.attemptsLeft === 'number') {
                setAttemptsLeft(result.attemptsLeft);
            }
            setModalState('otp');
            setCode(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    };

    const handleSetPassword = async () => {
        if (password.length < 8) {
            setPasswordError(t('otp.errors.passwordMin'));
            return;
        }

        if (!userId || !otpSessionId) return;

        setModalState('saving-password');
        setPasswordError(null);

        const result = await setPasswordForShadow({
            userId,
            otpSessionId,
            password,
        });

        if (result.success) {
            setPasswordSaved(true);
            setModalState('success');
        } else {
            setPasswordError(result.error || t('otp.errors.passwordSave'));
            setModalState('success');
        }
    };

    // Auto-submit when all 6 digits are entered
    useEffect(() => {
        const fullCode = code.join('');
        if (fullCode.length === 6 && modalState === 'otp') {
            handleVerify();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, modalState]);

    if (!isOpen) return null;

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={modalState === 'success' ? onClose : undefined}
            />

            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-slideUp">
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label={t('otp.close')}
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* ─── OTP Entry State ─── */}
                {(modalState === 'otp' || modalState === 'verifying') && (
                    <div className="p-8 pt-12">
                        <div className="text-center mb-8">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F2ED]">
                                <ShieldCheck className="h-8 w-8 text-stone-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-stone-800">
                                {t('otp.title')}
                            </h3>
                            <p className="mt-2 text-sm text-stone-500">
                                {t('otp.sentCode')}{' '}
                                <span className="font-medium text-stone-700">{maskedEmail}</span>
                            </p>
                        </div>

                        {/* OTP Input */}
                        <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleDigitChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    disabled={modalState === 'verifying'}
                                    className={`h-14 w-11 rounded-xl border-2 text-center text-xl font-semibold text-stone-800 outline-none transition-all
                                        ${error ? 'border-red-300 bg-red-50' : digit ? 'border-stone-400 bg-stone-50' : 'border-stone-200 bg-stone-50'}
                                        focus:border-stone-500 focus:ring-2 focus:ring-stone-200
                                        disabled:opacity-60`}
                                />
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-center text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Timer */}
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                            <span>{t('otp.codeValid')}</span>
                            <span className={`font-mono font-medium ${secondsLeft < 60 ? 'text-red-500' : 'text-stone-600'}`}>
                                {formatTime(secondsLeft)}
                            </span>
                        </div>

                        {/* Verify button */}
                        <button
                            onClick={handleVerify}
                            disabled={code.join('').length !== 6 || modalState === 'verifying'}
                            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-800 text-sm font-medium text-white transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {modalState === 'verifying' ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t('otp.verifying')}
                                </>
                            ) : (
                                t('otp.confirm')
                            )}
                        </button>

                        {attemptsLeft !== null && attemptsLeft > 0 && (
                            <p className="mt-3 text-center text-xs text-stone-400">
                                {t('otp.attemptsLeft', { count: attemptsLeft })}
                            </p>
                        )}
                    </div>
                )}

                {/* ─── Success State with Password Nudge ─── */}
                {(modalState === 'success' || modalState === 'saving-password') && (
                    <div className="p-8 pt-12">
                        <div className="text-center mb-6">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-stone-800">
                                {t('otp.successTitle')}
                            </h3>
                            <p className="mt-2 text-sm text-stone-500">
                                {t('otp.successBody')}
                            </p>
                        </div>

                        {/* Password Nudge — only show for shadow users who haven't set a password */}
                        {userId && !passwordSaved && (
                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 mb-6">
                                <div className="flex items-start gap-3 mb-3">
                                    <Lock className="h-5 w-5 text-stone-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-stone-700">
                                            {t('otp.passwordNudgeTitle')}
                                        </p>
                                        <p className="text-xs text-stone-400 mt-0.5">
                                            {t('otp.passwordNudgeBody')}
                                        </p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('otp.passwordPlaceholder')}
                                        disabled={modalState === 'saving-password'}
                                        className="h-11 w-full rounded-xl border border-stone-200 bg-white px-4 pr-10 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 disabled:opacity-60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? t('otp.hidePassword') : t('otp.showPassword')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {passwordError && (
                                    <p className="mt-2 text-xs text-red-500">{passwordError}</p>
                                )}

                                <button
                                    onClick={handleSetPassword}
                                    disabled={!password || password.length < 8 || modalState === 'saving-password'}
                                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-stone-800 text-sm font-medium text-white transition-all hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {modalState === 'saving-password' ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t('otp.savingPassword')}
                                        </>
                                    ) : (
                                        t('otp.savePassword')
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Password saved confirmation */}
                        {passwordSaved && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 mb-6 text-center">
                                <p className="text-sm text-emerald-700 font-medium">
                                    {t('otp.passwordSaved')}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="flex h-11 w-full items-center justify-center rounded-2xl border border-stone-200 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50"
                        >
                            {t('otp.close')}
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}
