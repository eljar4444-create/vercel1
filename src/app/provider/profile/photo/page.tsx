import { auth } from '@/auth';
import { UploadPhotoForm } from '@/components/provider/UploadPhotoForm';
import { ProviderSidebar } from '@/components/provider/ProviderSidebar';
import { redirect } from 'next/navigation';

export default async function PhotoPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/login');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col md:flex-row gap-12">
                {/* Sidebar updated */}
                <ProviderSidebar />

                <main className="flex-1 flex flex-col items-center justify-start pt-8">
                    <UploadPhotoForm currentImage={session.user.image} />
                </main>
            </div>
        </div>
    );
}
