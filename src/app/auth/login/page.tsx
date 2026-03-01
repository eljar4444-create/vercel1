'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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

/* ── Auth Content ───────────────────────────────────────── */

function AuthContent() {
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const type = searchParams.get('type');
    const errorCode = searchParams.get('error');

    const isProvider = role === 'provider';

    const errorMessage =
        errorCode === 'OAuthAccountNotLinked'
            ? 'Этот email уже используется другим способом входа. Войдите тем же способом, что и при регистрации.'
            : errorCode === 'OAuthCallback' || errorCode === 'Callback'
                ? 'Ошибка входа через Google. Проверьте: 1) В Google Cloud Console (API и сервисы → Учётные данные → ваш OAuth 2.0 клиент) в «Authorized redirect URIs» добавлен ровно: http://localhost:3000/api/auth/callback/google  2) В «Authorized JavaScript origins» добавлен: http://localhost:3000  3) В .env заданы AUTH_SECRET (например: openssl rand -base64 33), GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET.'
                : errorCode === 'Configuration'
                    ? 'Ошибка настройки авторизации. Добавьте в .env переменную AUTH_SECRET (не менее 32 символов).'
                    : errorCode
                        ? `Ошибка входа: ${errorCode}`
                        : null;

    /**
     * Технически необходимые куки для процесса регистрации (DSGVO compliant).
     * Сохраняем намерение пользователя (роль и тип аккаунта) перед
     * редиректом на Google/Apple. После успешной авторизации система
     * прочитает куки, создаст профиль нужного типа и удалит их.
     */
    const handleAuth = (provider: 'google' | 'apple') => {
        if (isProvider) {
            document.cookie = `onboarding_role=${role}; path=/; max-age=3600`;
            if (type) {
                document.cookie = `onboarding_type=${type}; path=/; max-age=3600`;
            }
        }
        signIn(provider, { callbackUrl: isProvider ? '/onboarding' : '/' });
    };

    // Dynamic copy
    const heading = isProvider ? 'Войти как партнёр' : 'Добро пожаловать в Svoi';
    const subheading = isProvider
        ? 'Авторизуйтесь, чтобы начать принимать клиентов'
        : 'Войдите или создайте аккаунт в один клик';

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
                    {isProvider && type && (
                        <div className="mt-4 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {type === 'SALON' ? '🏢 Салон' : '✂️ Частный мастер'}
                        </div>
                    )}

                    {/* OAuth error from callback */}
                    {errorMessage && (
                        <div className="mt-6 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {errorMessage}
                        </div>
                    )}

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
