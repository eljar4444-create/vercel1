'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, Send, User, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Conversation {
    id: string;
    serviceTitle: string;
    lastMessage: string;
    updatedAt: string;
    unreadCount: number;
    interlocutor: {
        name: string | null;
        image: string | null;
        email: string | null;
    };
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
}

export default function ChatPage() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [currentService, setCurrentService] = useState<any>(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // Poll for new conversations
        fetchConversations();
        const interval = setInterval(fetchConversations, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            // Use timeout to ensure DOM is updated
            setTimeout(scrollToBottom, 100);
        }
    }, [messages]);

    useEffect(() => {
        if (selectedChatId) {
            fetchMessages(selectedChatId);
            // Poll for new messages every 10 seconds (simple realtime)
            const interval = setInterval(() => fetchMessages(selectedChatId), 10000);
            return () => clearInterval(interval);
        }
    }, [selectedChatId]);

    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/chat');
            setConversations(res.data.requests);
        } catch (error) {
            console.error('Error fetching chats', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        // don't set loading on poll, only on first load
        // setIsMessagesLoading(true); 
        try {
            const res = await axios.get(`/api/chat/${chatId}`);
            setMessages(res.data.messages || []);
            if (res.data.service) {
                setCurrentService(res.data.service);
            }
        } catch (error) {
            console.error('Error fetching messages', error);
        } finally {
            setIsMessagesLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChatId) return;

        const optimisiticMessage = {
            id: 'temp-' + Date.now(),
            content: newMessage,
            senderId: session?.user?.id || '',
            createdAt: new Date().toISOString(),
            sender: {
                id: session?.user?.id || '',
                name: session?.user?.name || null,
                image: session?.user?.image || null
            }
        };

        setMessages(prev => [...prev, optimisiticMessage]);
        setNewMessage('');

        try {
            const res = await axios.post(`/api/chat/${selectedChatId}`, { content: optimisiticMessage.content });
            // Replace temp message with real one or just refetch
            // For simplicity, we assume success and just let the poll or next fetch sync exact ID
            fetchConversations(); // Update last message in sidebar
        } catch (error) {
            console.error('Error sending message', error);
            // Allow retry? Remove optimistic?
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!session) {
        return <div className="p-8 text-center">Пожалуйста, войдите в систему</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] max-w-[1200px] mt-20">
            <div className="grid grid-cols-1 md:grid-cols-4 h-full gap-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Sidebar (1 column) */}
                <div className={cn(
                    "col-span-1 border-r border-gray-100 flex-col h-full bg-gray-50/50 min-w-[300px]",
                    selectedChatId ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <h2 className="font-bold text-lg">Сообщения</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {conversations.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Нет активных чатов</p>
                            </div>
                        ) : (
                            conversations.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg transition-all hover:bg-white hover:shadow-sm flex items-start gap-3 relative",
                                        selectedChatId === chat.id ? "bg-white shadow-md ring-1 ring-black/5" : "text-gray-600"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        {chat.interlocutor.image ? (
                                            <img src={chat.interlocutor.image} alt={chat.interlocutor.name || ''} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <User className="w-5 h-5" />
                                            </div>
                                        )}
                                        {chat.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-white">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={cn("text-sm truncate", chat.unreadCount > 0 ? "font-bold text-black" : "font-semibold")}>
                                                {chat.interlocutor.name}
                                            </h3>
                                            <span className="text-[10px] text-gray-400">
                                                {format(new Date(chat.updatedAt), 'HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-600 font-medium truncate mb-0.5">{chat.serviceTitle}</p>
                                        <p className={cn("text-xs truncate", chat.unreadCount > 0 ? "font-semibold text-gray-900" : "text-gray-500")}>
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area (2 columns) */}
                <div className={cn(
                    "col-span-1 md:col-span-2 flex-col h-full bg-white border-r border-gray-100",
                    selectedChatId ? "flex" : "hidden md:flex"
                )}>
                    {selectedChatId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden -ml-2"
                                    onClick={() => setSelectedChatId(null)}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <h3 className="font-bold">Чат</h3>
                                {conversations.find(c => c.id === selectedChatId)?.serviceTitle && (
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {conversations.find(c => c.id === selectedChatId)?.serviceTitle}
                                    </span>
                                )}
                            </div>

                            {/* Messages */}
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30"
                            >
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === session.user.id;
                                    const prevMsg = messages[idx - 1];
                                    const isNewDay = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                                    return (
                                        <div key={msg.id} className="w-full">
                                            {isNewDay && (
                                                <div className="flex justify-center my-4">
                                                    <span className="bg-gray-100/80 text-gray-500 text-xs py-1 px-3 rounded-full font-medium">
                                                        {format(new Date(msg.createdAt), 'd MMMM', { locale: ru })}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={cn("flex w-full mb-2", isMe ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "relative max-w-[70%] px-3 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
                                                    isMe
                                                        ? "bg-[#effdde] text-black rounded-2xl rounded-br-sm"
                                                        : "bg-white text-black rounded-2xl rounded-bl-sm"
                                                )}>
                                                    <div className="break-words pr-2">
                                                        {msg.content}
                                                    </div>
                                                    <div className={cn(
                                                        "text-[10px] text-gray-400 float-right ml-2 mt-1 select-none"
                                                    )}>
                                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Напишите сообщение..."
                                        className="flex-1 px-4 py-2 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="rounded-full bg-blue-600 hover:bg-blue-700 w-10 h-10 shrink-0"
                                        disabled={!newMessage.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 opacity-20" />
                            </div>
                            <p>Выберите чат для начала общения</p>
                        </div>
                    )}
                </div>

                {/* Service Info Panel (1 column) */}
                <div className="col-span-1 hidden md:flex flex-col h-full bg-gray-50/30 p-6 overflow-y-auto">
                    {selectedChatId && currentService ? (
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 text-lg">Информация об услуге</h3>

                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                {currentService.photos && currentService.photos.length > 0 && (
                                    <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-gray-100">
                                        <img src={currentService.photos[0].url} alt={currentService.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <h4 className="font-bold text-gray-900 mb-2">{currentService.title}</h4>
                                <div className="text-2xl font-bold text-blue-600 mb-4">{currentService.price} €</div>

                                <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-xl h-10" asChild>
                                    <a href={`/services/${currentService.id}`} target="_blank" rel="noopener noreferrer">
                                        Открыть услугу
                                    </a>
                                </Button>
                            </div>

                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <h5 className="font-bold text-gray-900 mb-2 text-sm">Описание</h5>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {currentService.description}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                            <p className="text-sm">Выберите чат, чтобы увидеть<br />информацию об услуге</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
