import { Suspense } from 'react';
import { CreateServiceForm } from '@/components/provider/CreateServiceForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function CreateServicePage() {
    const session = await auth();
    if (!session) redirect('/auth/login');

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <CreateServiceForm />
        </Suspense>
    );
}
