import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false } };

export default function MyBookingsRedirect() {
    redirect('/dashboard');
}
