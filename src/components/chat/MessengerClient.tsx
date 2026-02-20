'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarDays, Loader2, MessageSquare, Send, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    getConversationBookingContext,
    getConversationMessages,
    getMyConversations,
    sendMessage,
} from '@/app/actions/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type ConversationItem = {
    id: string;
    updatedAt: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    interlocutor: {
        name: string | null;
        image: string | null;
        subtitle?: string | null;
    };
};

type MessageItem = {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
        email: string | null;
    };
};

type BookingContext = {
    id: number;
    serviceTitle: string;
    date: string;
    time: string;
    status: string;
} | null;

interface MessengerClientProps {
    initialConversations: ConversationItem[];
    initialConversationId: string | null;
    currentUserId: string;
    initialBookingContext: BookingContext;
}

function getInitials(name?: string | null) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
}

export function MessengerClient({
    initialConversations,
    initialConversationId,
    currentUserId,
    initialBookingContext,
}: MessengerClientProps) {
    const [conversations, setConversations] = useState(initialConversations);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
        initialConversationId || initialConversations[0]?.id || null
    );
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [bookingContext, setBookingContext] = useState<BookingContext>(initialBookingContext);
    const [isSending, startSending] = useTransition();

    const selectedConversation = useMemo(
        () => conversations.find((item) => item.id === selectedConversationId) || null,
        [conversations, selectedConversationId]
    );

    const refreshConversations = async () => {
        const result = await getMyConversations();
        if (result.success) {
            setConversations(result.conversations);
            if (!selectedConversationId && result.conversations[0]) {
                setSelectedConversationId(result.conversations[0].id);
            }
        }
    };

    const loadMessages = async (conversationId: string, options?: { background?: boolean }) => {
        const isBackground = Boolean(options?.background);
        if (!isBackground) {
            setIsLoadingMessages(true);
        }
        const result = await getConversationMessages(conversationId);
        if (result.success) {
            setMessages(result.messages);
        } else if (!isBackground) {
            setMessages([]);
        }
        if (!isBackground) {
            setIsLoadingMessages(false);
        }
    };

    const loadBookingContext = async (conversationId: string) => {
        const result = await getConversationBookingContext(conversationId);
        if (result.success) {
            setBookingContext(result.booking);
        } else {
            setBookingContext(null);
        }
    };

    useEffect(() => {
        refreshConversations();
    }, []);

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            setBookingContext(null);
            return;
        }
        loadMessages(selectedConversationId);
        loadBookingContext(selectedConversationId);
        refreshConversations();
    }, [selectedConversationId]);

    useEffect(() => {
        const interval = setInterval(() => {
            refreshConversations();
            if (selectedConversationId) {
                loadMessages(selectedConversationId, { background: true });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [selectedConversationId]);

    const handleSend = (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedConversationId || !newMessage.trim()) return;

        const payload = new FormData();
        payload.set('conversationId', selectedConversationId);
        payload.set('content', newMessage.trim());
        setNewMessage('');

        startSending(async () => {
            await sendMessage(payload);
            await loadMessages(selectedConversationId, { background: true });
            await refreshConversations();
        });
    };

    const bookingStatus = useMemo(() => {
        if (!bookingContext) return null;

        if (bookingContext.status === 'confirmed') {
            return {
                label: 'Подтверждено',
                className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            };
        }

        if (bookingContext.status === 'pending') {
            return {
                label: 'Ожидает подтверждения',
                className: 'border-amber-200 bg-amber-50 text-amber-700',
            };
        }

        if (bookingContext.status === 'cancelled') {
            return {
                label: 'Отменено',
                className: 'border-rose-200 bg-rose-50 text-rose-700',
            };
        }

        return {
            label: bookingContext.status,
            className: 'border-slate-200 bg-slate-100 text-slate-700',
        };
    }, [bookingContext]);

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-start justify-center bg-slate-50 px-4 py-8">
            <div className="flex h-[700px] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:w-80 md:max-w-md">
                    <div className="border-b border-gray-100 bg-white px-4 py-4">
                        <h2 className="text-lg font-bold text-gray-900">Чаты</h2>
                        <p className="text-xs text-gray-500">Личные сообщения с клиентами и мастерами</p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageSquare className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                                <p className="text-sm">Диалогов пока нет</p>
                            </div>
                        ) : (
                            <div className="space-y-1 p-2">
                                {conversations.map((conversation) => (
                                    <button
                                        key={conversation.id}
                                        onClick={() => setSelectedConversationId(conversation.id)}
                                        className={cn(
                                            'w-full rounded-xl border px-3 py-3 text-left transition',
                                            selectedConversationId === conversation.id
                                                ? 'border-gray-900 bg-white shadow-sm'
                                                : 'border-transparent bg-transparent hover:bg-white'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {conversation.interlocutor.image ? (
                                                <img
                                                    src={conversation.interlocutor.image}
                                                    alt={conversation.interlocutor.name || 'User'}
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />
                                            ) : (
                                                <UserCircle className="h-9 w-9 text-gray-300" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        'truncate text-sm text-gray-900',
                                                        conversation.unreadCount > 0 ? 'font-semibold' : 'font-medium'
                                                    )}
                                                >
                                                        {conversation.interlocutor.name || 'Собеседник'}
                                                    </p>
                                                <div className="flex items-center gap-2">
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-semibold text-white">
                                                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-400">
                                                        {format(new Date(conversation.lastMessageAt), 'HH:mm', { locale: ru })}
                                                    </span>
                                                </div>
                                                </div>
                                                <p className="truncate text-xs text-gray-500">{conversation.lastMessage}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <section className="flex h-full min-w-0 flex-1 flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src={selectedConversation.interlocutor.image || undefined}
                                        alt={selectedConversation.interlocutor.name || 'Собеседник'}
                                    />
                                    <AvatarFallback>{getInitials(selectedConversation.interlocutor.name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                        {selectedConversation.interlocutor.name || 'Собеседник'}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">{selectedConversation.interlocutor.subtitle || 'Диалог'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm md:px-6">
                                {bookingContext ? (
                                    <>
                                        <div className="min-w-0 pr-2 text-slate-700">
                                            <p className="flex items-center gap-2 truncate font-medium text-slate-800">
                                                <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                                                <span className="truncate">
                                                    {bookingContext.serviceTitle} • {format(new Date(bookingContext.date), 'd MMMM', { locale: ru })} в {bookingContext.time}
                                                </span>
                                            </p>
                                        </div>
                                        {bookingStatus ? (
                                            <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium', bookingStatus.className)}>
                                                {bookingStatus.label}
                                            </span>
                                        ) : null}
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-500">Нет связанной записи для этого диалога</p>
                                )}
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-4 md:p-6">
                                {isLoadingMessages ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                                        Начните диалог первым сообщением
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map((message) => {
                                            const isMine = message.senderId === currentUserId;
                                            return (
                                                <div key={message.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                                                    <div
                                                        className={cn(
                                                            'max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                                                            isMine
                                                                ? 'rounded-2xl rounded-tr-sm bg-slate-900 text-white'
                                                                : 'rounded-2xl rounded-tl-sm bg-slate-100 text-slate-900'
                                                        )}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                        <p className={cn('mt-1 text-xs opacity-70', isMine ? 'text-slate-200' : 'text-slate-500')}>
                                                            {format(new Date(message.createdAt), 'dd.MM HH:mm', { locale: ru })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={newMessage}
                                        onChange={(event) => setNewMessage(event.target.value)}
                                        placeholder="Введите сообщение..."
                                        className="h-11 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-400"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="h-11 rounded-full bg-slate-900 px-4 text-white hover:bg-slate-800"
                                    >
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                            Выберите диалог слева
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
