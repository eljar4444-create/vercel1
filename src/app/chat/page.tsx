'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Loader2, Send, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Conversation {
    id: string;
    serviceTitle: string;
    lastMessage: string;
    updatedAt: string;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (session) {
            fetchConversations();
        }
    }, [session]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (selectedChatId) {
            fetchMessages(selectedChatId);
            // Poll for new messages every 5 seconds
            const interval = setInterval(() => fetchMessages(selectedChatId), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedChatId]);

    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/chat');
            setConversations(res.data.requests || []); // Use requests or chats depending on API
        } catch (error) {
            console.error('Error fetching chats', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            const res = await axios.get(`/api/chat/${chatId}`);
            setMessages(res.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChatId) return;

        const optimisiticMessage: Message = {
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
            await axios.post(`/api/chat/${selectedChatId}`, { content: optimisiticMessage.content });
            fetchConversations(); // Update sidebar last message
            fetchMessages(selectedChatId); // Refresh messages to get real ID
        } catch (error) {
            console.error('Error sending message', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center pt-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!session) {
        return <div className="p-8 text-center pt-24">Пожалуйста, войдите в систему</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] max-w-6xl mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-6 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Sidebar */}
                <div className="col-span-1 border-r border-gray-100 flex flex-col h-full bg-gray-50/50">
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
                                        "w-full text-left p-3 rounded-lg transition-all hover:bg-white hover:shadow-sm flex items-start gap-3",
                                        selectedChatId === chat.id ? "bg-white shadow-md ring-1 ring-black/5" : "text-gray-600"
                                    )}
                                >
                                    <div className="relative">
                                        {chat.interlocutor.image ? (
                                            <img src={chat.interlocutor.image} alt={chat.interlocutor.name || ''} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <User className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-semibold text-sm truncate">{chat.interlocutor.name || 'User'}</h3>
                                            <span className="text-[10px] text-gray-400">
                                                {format(new Date(chat.updatedAt), 'HH:mm')}
                                            </span>
                                        </div>
                                        {/* <p className="text-xs text-blue-600 font-medium truncate mb-0.5">{chat.serviceTitle}</p> */}
                                        <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="col-span-1 md:col-span-2 flex flex-col h-full bg-white">
                    {selectedChatId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                                <h3 className="font-bold">Чат</h3>
                                {conversations.find(c => c.id === selectedChatId)?.serviceTitle && (
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {conversations.find(c => c.id === selectedChatId)?.serviceTitle}
                                    </span>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === session.user?.id;
                                    return (
                                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[70%] rounded-2xl p-3 text-sm shadow-sm",
                                                isMe
                                                    ? "bg-blue-600 text-white rounded-br-none"
                                                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                            )}>
                                                {msg.content}
                                                <div className={cn("text-[10px] mt-1 text-right", isMe ? "text-blue-200" : "text-gray-400")}>
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
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
            </div>
        </div>
    );
}
