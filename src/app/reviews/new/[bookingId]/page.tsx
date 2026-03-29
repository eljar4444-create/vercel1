import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ReviewForm } from './ReviewForm';

interface Props {
    params: { bookingId: string };
}

export default async function NewReviewPage({ params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/reviews/new/' + params.bookingId);
    }

    const bookingId = parseInt(params.bookingId, 10);
    if (isNaN(bookingId)) {
        return <div className="p-8 text-center text-red-500">Неверная ссылка на отзыв.</div>;
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            profile: { select: { name: true, image_url: true, slug: true } },
            service: { select: { title: true } },
            review: { select: { id: true } }
        }
    });

    if (!booking) {
        return <div className="p-8 text-center text-red-500">Запись не найдена.</div>;
    }

    if (booking.review) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl">✓</div>
                <h2 className="text-xl font-bold mb-2">Вы уже оставили отзыв</h2>
                <p className="text-gray-500 mb-6">Спасибо! Ваш отзыв уже опубликован на странице мастера.</p>
                <a href={`/salon/${booking.profile.slug}`} className="px-6 py-2 bg-black text-white rounded-lg">Перейти к профилю</a>
            </div>
        );
    }

    if (booking.user_id !== session.user.id) {
        return <div className="p-8 text-center text-red-500">У вас нет прав для оценки этой записи.</div>;
    }

    return (
        <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
            <h1 className="text-2xl font-bold mb-8 text-center">Оцените ваш визит</h1>
            
            <div className="bg-white p-6 rounded-2xl border shadow-sm mb-6 flex items-center gap-4">
                {booking.profile.image_url ? (
                    <img src={booking.profile.image_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
                        👤
                    </div>
                )}
                <div>
                    <h2 className="font-semibold text-lg">{booking.profile.name}</h2>
                    <p className="text-gray-500">
                        {booking.service?.title || 'Услуга'} • {new Date(booking.date).toLocaleDateString('ru-RU')}
                    </p>
                </div>
            </div>

            <ReviewForm bookingId={booking.id} profileSlug={booking.profile.slug} />
        </div>
    );
}
