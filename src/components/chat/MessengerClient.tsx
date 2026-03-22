'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
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

    const refreshConversations = useCallback(async () => {
        const result = await getMyConversations();
        if (result.success) {
            setConversations(result.conversations);
            if (!selectedConversationId && result.conversations[0]) {
                setSelectedConversationId(result.conversations[0].id);
            }
        }
    }, [selectedConversationId]);

    const loadMessages = useCallback(async (conversationId: string, options?: { background?: boolean }) => {
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
    }, []);

    const loadBookingContext = useCallback(async (conversationId: string) => {
        const result = await getConversationBookingContext(conversationId);
        if (result.success) {
            setBookingContext(result.booking);
        } else {
            setBookingContext(null);
        }
    }, []);

    useEffect(() => {
        refreshConversations();
    }, [refreshConversations]);

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            setBookingContext(null);
            return;
        }
        loadMessages(selectedConversationId);
        loadBookingContext(selectedConversationId);
        refreshConversations();
    }, [selectedConversationId, loadBookingContext, loadMessages, refreshConversations]);

    useEffect(() => {
        const interval = setInterval(() => {
            refreshConversations();
            if (selectedConversationId) {
                loadMessages(selectedConversationId, { background: true });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [selectedConversationId, loadMessages, refreshConversations]);

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
        <div className="min-h-[calc(100vh-80px)] bg-transparent px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto flex min-h-[calc(100vh-128px)] w-full max-w-6xl flex-col gap-5 lg:max-h-[780px] lg:flex-row">
                <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[28px] border border-stone-200/80 bg-[rgba(245,242,235,0.78)] backdrop-blur-sm lg:min-h-0 lg:w-[320px] xl:w-[348px]">
                    <div className="border-b border-stone-200 px-5 py-5">
                        <h2 className="text-lg font-bold text-stone-900">Чаты</h2>
                        <p className="text-xs text-stone-500">Личные сообщения с клиентами и мастерами</p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-stone-500">
                                <MessageSquare className="mx-auto mb-2 h-10 w-10 text-stone-300" />
                                <p className="text-sm">Диалогов пока нет</p>
                            </div>
                        ) : (
                            <div>
                                {conversations.map((conversation) => (
                                    <button
                                        key={conversation.id}
                                        onClick={() => setSelectedConversationId(conversation.id)}
                                        className={cn(
                                            'relative w-full border-b border-stone-200 px-4 py-4 text-left transition last:border-b-0',
                                            selectedConversationId === conversation.id
                                                ? 'bg-[#EEE6D8]'
                                                : 'bg-transparent hover:bg-[#F1EBE0]'
                                        )}
                                    >
                                        {selectedConversationId === conversation.id ? (
                                            <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-stone-700/75" aria-hidden="true" />
                                        ) : null}
                                        <div className="flex items-center gap-2">
                                            {conversation.interlocutor.image ? (
                                                <img
                                                    src={conversation.interlocutor.image}
                                                    alt={conversation.interlocutor.name || 'User'}
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />
                                            ) : (
                                                <UserCircle className="h-9 w-9 text-stone-300" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        'truncate text-sm text-stone-900',
                                                        conversation.unreadCount > 0 ? 'font-semibold' : 'font-medium'
                                                    )}
                                                >
                                                        {conversation.interlocutor.name || 'Собеседник'}
                                                    </p>
                                                <div className="flex items-center gap-2">
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-800 px-1.5 text-[10px] font-semibold text-white">
                                                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-stone-400">
                                                        {format(new Date(conversation.lastMessageAt), 'HH:mm', { locale: ru })}
                                                    </span>
                                                </div>
                                                </div>
                                                <p className="truncate text-xs text-stone-500">{conversation.lastMessage}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <section className="flex min-h-[540px] min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
                    {selectedConversation ? (
                        <>
                            <div className="flex h-16 items-center gap-3 border-b border-stone-200 bg-white px-5 md:px-6">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src={selectedConversation.interlocutor.image || undefined}
                                        alt={selectedConversation.interlocutor.name || 'Собеседник'}
                                    />
                                    <AvatarFallback>{getInitials(selectedConversation.interlocutor.name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-stone-900">
                                        {selectedConversation.interlocutor.name || 'Собеседник'}
                                    </p>
                                    <p className="truncate text-xs text-stone-500">{selectedConversation.interlocutor.subtitle || 'Диалог'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3 text-sm md:px-6">
                                {bookingContext ? (
                                    <>
                                        <div className="min-w-0 pr-2 text-stone-700">
                                            <p className="flex items-center gap-2 truncate font-medium text-stone-800">
                                                <CalendarDays className="h-4 w-4 shrink-0 text-stone-500" />
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
                                    <p className="text-xs text-stone-500">Нет связанной записи для этого диалога</p>
                                )}
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 md:p-6">
                                {isLoadingMessages ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-sm text-stone-500">
                                        Начните диалог первым сообщением
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {messages.map((message) => {
                                            const isMine = message.senderId === currentUserId;
                                            return (
                                                <div key={message.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                                                    <div
                                                        className={cn(
                                                            'max-w-[78%] rounded-2xl border px-3.5 py-2.5 text-sm shadow-sm',
                                                            isMine
                                                                ? 'rounded-2xl rounded-tr-sm border-[#E2D5C0] bg-[#EDE3D2] text-stone-900'
                                                                : 'rounded-2xl rounded-tl-sm border-stone-200 bg-stone-100 text-stone-900'
                                                        )}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                        <p className="mt-1.5 text-xs text-stone-500/80">
                                                            {format(new Date(message.createdAt), 'dd.MM HH:mm', { locale: ru })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSend} className="border-t border-stone-200 bg-white p-4 md:px-6">
                                <div className="flex items-center gap-3">
                                    <input
                                        value={newMessage}
                                        onChange={(event) => setNewMessage(event.target.value)}
                                        placeholder="Введите сообщение..."
                                        className="h-11 flex-1 rounded-full border border-stone-200 bg-transparent px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="h-11 w-11 rounded-full border border-stone-200 bg-[#F3ECE0] p-0 text-stone-700 shadow-none transition hover:bg-[#E8DEC9] disabled:border-stone-200 disabled:bg-transparent disabled:text-stone-300"
                                    >
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-stone-500">
                            Выберите диалог слева
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
