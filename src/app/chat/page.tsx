import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default async function ChatPage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/login');

    const chats = await prisma.chat.findMany({
        where: {
            participants: {
                some: {
                    userId: session.user.id
                }
            }
        },
        include: {
            participants: {
                include: {
                    user: true
                }
            },
            messages: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return (
        <div className="container mx-auto px-4 py-24 min-h-screen">
            <h1 className="text-3xl font-bold mb-8">Сообщения</h1>

            {chats.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">У вас пока нет сообщений</h2>
                    <p className="text-gray-500 mb-6">Начните общение с исполнителем или заказчиком на странице услуги.</p>
                    <Button asChild>
                        <Link href="/search">Найти услуги</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {chats.map(chat => {
                        const otherParticipant = chat.participants.find(p => p.userId !== session.user.id)?.user;
                        const lastMessage = chat.messages[0];

                        return (
                            <Link key={chat.id} href={`/chat/${chat.id}`}>
                                <Card className="p-6 hover:shadow-md transition-shadow flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                            {otherParticipant?.image ? (
                                                <img src={otherParticipant.image} alt={otherParticipant.name || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-500">
                                                    {otherParticipant?.name?.[0] || '?'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                                                {otherParticipant?.name || 'Unknown User'}
                                            </div>
                                            <div className="text-gray-500 truncate max-w-md">
                                                {lastMessage?.content || 'Нет сообщений'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString() : ''}
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
