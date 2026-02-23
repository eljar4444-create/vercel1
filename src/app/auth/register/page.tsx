import { redirect } from 'next/navigation';

/**
 * Register page now redirects to login since OAuth makes
 * sign-in and sign-up the same action.
 *
 * Preserves query params (e.g. ?role=provider&type=SALON) so that
 * the login page can build the correct callbackUrl.
 */
export default function RegisterPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
        if (typeof value === 'string') {
            params.set(key, value);
        }
    }
    const qs = params.toString();
    redirect(`/auth/login${qs ? `?${qs}` : ''}`);
}
