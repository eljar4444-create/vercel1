import { auth } from '@/auth';
import { ProviderSidebar } from '@/components/provider/ProviderSidebar';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function VerificationSuccessPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/login');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col md:flex-row gap-12">
                <ProviderSidebar />

                <main className="flex-1 flex flex-col items-center justify-center pt-20">
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold mb-3">Документы отправлены!</h1>
                        <p className="text-gray-500 mb-8">
                            Мы получили ваши документы. Проверка обычно занимает от 1 до 24 часов.
                            Мы уведомим вас о результатах.
                        </p>

                        <Link href="/provider/profile">
                            <Button className="w-full h-12 text-base font-bold rounded-xl">
                                Вернуться в профиль
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        </div>
    );
}
