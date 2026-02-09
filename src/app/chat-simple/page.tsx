'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function ChatPageSimple() {
    const { data: session } = useSession();
    const [chats, setChats] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (session) {
            axios.get('/api/chat').then(res => setChats(res.data.requests || []));
        }
    }, [session]);

    useEffect(() => {
        if (selectedId) {
            axios.get(`/api/chat/${selectedId}`).then(res => setMessages(res.data.messages || []));
        }
    }, [selectedId]);

    const send = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        try {
            await axios.post(`/api/chat/${selectedId}`, { content: input });
            setInput('');
            const res = await axios.get(`/api/chat/${selectedId}`);
            setMessages(res.data.messages || []);
        } catch (err) {
            alert('Error: ' + (err.response?.data?.details || err.message));
        }
    };

    if (!session) return <div>Please login</div>;

    return (
        <div style={{ display: 'flex', height: '80vh', gap: '20px', padding: '20px' }}>
            <div style={{ width: '300px', border: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>
                <h3>Chats</h3>
                {chats.map(chat => (
                    <div
                        key={chat.id}
                        onClick={() => setSelectedId(chat.id)}
                        style={{
                            padding: '10px',
                            cursor: 'pointer',
                            background: selectedId === chat.id ? '#e0e0e0' : 'white',
                            marginBottom: '5px',
                            border: '1px solid #ddd'
                        }}
                    >
                        <div><strong>{chat.interlocutor?.name}</strong></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{chat.serviceTitle}</div>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, border: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
                {selectedId ? (
                    <>
                        <div style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f5f5f5' }}>
                            <h3>Chat</h3>
                        </div>
                        <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    style={{
                                        marginBottom: '10px',
                                        padding: '10px',
                                        background: msg.senderId === session.user.id ? '#dcf8c6' : '#fff',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        maxWidth: '70%',
                                        marginLeft: msg.senderId === session.user.id ? 'auto' : '0'
                                    }}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={send} style={{ padding: '10px', borderTop: '1px solid #ccc', display: 'flex', gap: '10px' }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        Select a chat
                    </div>
                )}
            </div>
        </div>
    );
}
