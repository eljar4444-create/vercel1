import { redirect } from 'next/navigation';

export default function BecomeProPage() {
    redirect('/auth/register?role=provider');
}
