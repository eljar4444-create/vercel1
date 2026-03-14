'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { saveToken } from '@/lib/auth';

/* ── SVG Icons ──────────────────────────────────────────── */

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 384 512" fill="currentColor">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
        </svg>
    );
}

function EmailIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
    );
}

function SpinnerIcon() {
    return (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

/* ── Auth Content ───────────────────────────────────────── */

function AuthContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = searchParams.get('role');
    const type = searchParams.get('type');
    const errorCode = searchParams.get('error');

    const isProvider = role === 'provider';
    const providerType = type === 'SALON' ? 'SALON' : 'INDIVIDUAL';
    const providerOnboardingUrl = `/onboarding?type=${providerType}`;
    const postAuthRedirect = isProvider ? providerOnboardingUrl : '/dashboard';

    // State
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const errorMessage =
        errorCode === 'OAuthAccountNotLinked'
            ? 'Этот email уже используется другим способом входа. Войдите тем же способом, что и при регистрации.'
            : errorCode === 'OAuthCallback' || errorCode === 'Callback'
                ? 'Ошибка входа через Google. Проверьте настройки OAuth.'
                : errorCode === 'Configuration'
                    ? 'Ошибка настройки авторизации. Добавьте в .env переменную AUTH_SECRET.'
                    : errorCode
                        ? `Ошибка входа: ${errorCode}`
                        : null;

    const handleAuth = (provider: 'google' | 'apple') => {
        if (isProvider) {
            document.cookie = `onboarding_role=${role}; path=/; max-age=3600`;
            document.cookie = `onboarding_type=${providerType}; path=/; max-age=3600`;
        }
        signIn(provider, { callbackUrl: postAuthRedirect });
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            if (isRegisterMode) {
                const registerUrl = isProvider
                    ? `/api/auth/register?role=provider&type=${providerType}`
                    : '/api/auth/register';

                // Registration via our API
                const res = await fetch(registerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        name,
                        role: 'USER',
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    const msg = typeof data.error === 'string'
                        ? data.error
                        : 'Ошибка регистрации. Проверьте данные.';
                    setFormError(msg);
                    return;
                }

                // Save JWT token
                if (data.token) {
                    saveToken(data.token);
                }

                // Create NextAuth session so UI (header, etc.) reflects logged-in state
                await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                setSuccessMessage('Аккаунт создан! Перенаправление...');
                setTimeout(() => {
                    router.push(postAuthRedirect);
                }, 1000);
            } else {
                // Login via our API
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setFormError(data.error || 'Неверный email или пароль.');
                    return;
                }

                // Save JWT token
                if (data.token) {
                    saveToken(data.token);
                }

                // Create NextAuth session so UI (header, etc.) reflects logged-in state
                await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                setSuccessMessage('Вход выполнен! Перенаправление...');
                setTimeout(() => {
                    router.push(postAuthRedirect);
                }, 1000);
            }
        } catch {
            setFormError('Ошибка сервера. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    // Dynamic copy
    const heading = showEmailForm
        ? isRegisterMode
            ? 'Создать аккаунт'
            : 'Войти по Email'
        : isProvider
            ? 'Войти как партнёр'
            : 'Добро пожаловать в Svoi';

    const subheading = showEmailForm
        ? isRegisterMode
            ? 'Заполните данные для регистрации'
            : 'Введите email и пароль'
        : isProvider
            ? 'Авторизуйтесь, чтобы начать принимать клиентов'
            : 'Войдите или создайте аккаунт';

    return (
        <div className="min-h-screen grid md:grid-cols-2">
            {/* ── Left Column: Auth Form ── */}
            <div className="flex flex-col items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-[400px] flex flex-col items-center">
                    {/* Logo */}
                    <Link href="/" className="mb-12 transition-opacity hover:opacity-80">
                        <Image
                            src="/logo-black.png"
                            alt="Svoi.de"
                            width={120}
                            height={40}
                            priority
                        />
                    </Link>

                    {/* Heading */}
                    <h1 className="text-3xl font-semibold text-gray-900 text-center tracking-tight">
                        {heading}
                    </h1>
                    <p className="mt-3 text-base text-gray-500 text-center">
                        {subheading}
                    </p>

                    {/* Provider type badge */}
                    {isProvider && (
                        <div className="mt-4 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {providerType === 'SALON' ? '🏢 Салон' : '✂️ Частный мастер'}
                        </div>
                    )}

                    {/* OAuth error from callback */}
                    {errorMessage && (
                        <div className="mt-6 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {errorMessage}
                        </div>
                    )}

                    {/* Form error */}
                    {formError && (
                        <div className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    {/* Success message */}
                    {successMessage && (
                        <div className="mt-4 w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {successMessage}
                        </div>
                    )}

                    {!showEmailForm ? (
                        <>
                            {/* OAuth Buttons */}
                            <div className="mt-10 w-full space-y-4">
                                {/* Apple */}
                                <button
                                    onClick={() => handleAuth('apple')}
                                    className="
                                        group relative flex w-full items-center justify-center gap-3
                                        h-12 rounded-xl bg-black text-white font-medium text-[15px]
                                        transition-all duration-200
                                        hover:bg-gray-900 hover:shadow-lg hover:shadow-black/10
                                        active:scale-[0.98]
                                    "
                                >
                                    <AppleIcon />
                                    Продолжить с Apple
                                </button>

                                {/* Google */}
                                <button
                                    onClick={() => handleAuth('google')}
                                    className="
                                        group relative flex w-full items-center justify-center gap-3
                                        h-12 rounded-xl bg-white text-gray-800 font-medium text-[15px]
                                        border border-gray-200
                                        transition-all duration-200
                                        hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/60
                                        active:scale-[0.98]
                                    "
                                >
                                    <GoogleIcon />
                                    Продолжить с Google
                                </button>
                            </div>

                            {/* Separator */}
                            <div className="mt-6 w-full flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium">ИЛИ</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Email button */}
                            <button
                                onClick={() => setShowEmailForm(true)}
                                className="
                                    mt-6 group relative flex w-full items-center justify-center gap-3
                                    h-12 rounded-xl bg-gray-900 text-white font-medium text-[15px]
                                    transition-all duration-200
                                    hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20
                                    active:scale-[0.98]
                                "
                            >
                                <EmailIcon />
                                Продолжить с Email
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Email/Password Form */}
                            <form onSubmit={handleEmailSubmit} className="mt-8 w-full space-y-4">
                                {isRegisterMode && (
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Имя
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            minLength={2}
                                            placeholder="Ваше имя"
                                            className="
                                                w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50
                                                text-gray-900 text-[15px] placeholder:text-gray-400
                                                outline-none transition-all duration-200
                                                focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200
                                            "
                                        />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="name@example.com"
                                        className="
                                            w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50
                                            text-gray-900 text-[15px] placeholder:text-gray-400
                                            outline-none transition-all duration-200
                                            focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200
                                        "
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Пароль
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder={isRegisterMode ? 'Минимум 6 символов' : 'Ваш пароль'}
                                            className="
                                                w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 bg-gray-50
                                                text-gray-900 text-[15px] placeholder:text-gray-400
                                                outline-none transition-all duration-200
                                                focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200
                                            "
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        w-full h-12 rounded-xl bg-gray-900 text-white font-medium text-[15px]
                                        transition-all duration-200
                                        hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20
                                        active:scale-[0.98]
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    {loading ? (
                                        <SpinnerIcon />
                                    ) : (
                                        isRegisterMode ? 'Создать аккаунт' : 'Войти'
                                    )}
                                </button>
                            </form>

                            {/* Toggle login / register */}
                            <p className="mt-5 text-sm text-gray-500 text-center">
                                {isRegisterMode ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegisterMode(!isRegisterMode);
                                        setFormError(null);
                                        setSuccessMessage(null);
                                    }}
                                    className="text-gray-900 font-medium hover:underline underline-offset-2 transition-colors"
                                >
                                    {isRegisterMode ? 'Войти' : 'Зарегистрироваться'}
                                </button>
                            </p>

                            {/* Separator */}
                            <div className="mt-5 w-full flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium">ИЛИ</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Back to OAuth */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEmailForm(false);
                                    setFormError(null);
                                    setSuccessMessage(null);
                                }}
                                className="
                                    mt-5 text-sm text-gray-500 hover:text-gray-700 font-medium
                                    transition-colors underline underline-offset-2
                                "
                            >
                                ← Назад к другим способам входа
                            </button>
                        </>
                    )}

                    {/* Legal footer */}
                    <p className="mt-8 text-xs text-gray-400 text-center leading-relaxed max-w-[320px]">
                        Продолжая, вы соглашаетесь с нашими{' '}
                        <Link href="/agb" className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
                            AGB
                        </Link>{' '}
                        и{' '}
                        <Link href="/datenschutz" className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
                            Datenschutz
                        </Link>
                        .
                    </p>
                </div>
            </div>

            {/* ── Right Column: Hero Image ── */}
            <div className="hidden md:block relative">
                <Image
                    src="/auth-hero.png"
                    alt="Премиальный бьюти-салон"
                    fill
                    className="object-cover"
                    priority
                    sizes="50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
        </div>
    );
}

/* ── Page Export ─────────────────────────────────────────── */

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <AuthContent />
        </Suspense>
    );
}
