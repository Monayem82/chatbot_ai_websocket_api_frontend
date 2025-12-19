import { useState, useEffect, useRef, useContext } from 'react';
import api from '../../context/api.js';
import { AuthContext } from '../../context/AuthContext.jsx';
import AuthProvider from '../../context/AuthProvider.jsx';

const ChatWindow = ({ activeChat }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const scrollRef = useRef(null);

    const { user } = useContext(AuthContext);

    // Load history + open WebSocket when activeChat changes
    useEffect(() => {
        if (!activeChat?.id) return;

        // Clear old messages when switching rooms
        // setMessages([]);

        // Fetch history
        api
            .get(`chat-websoket/api/message/${activeChat.id}/`)
            .then((res) => setMessages(res.data))
            .catch((err) => console.error('Failed to fetch messages', err));

        // Open WebSocket
        const token = localStorage.getItem('accessToken');
        const ws = new WebSocket(
            `ws://127.0.0.1:8000/ws/chat-explore/${activeChat.id}/?token=${token}`
        );

        ws.onopen = () => setSocket(ws);

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                setMessages((prev) => [...prev, data]);
            } catch (err) {
                console.error('Invalid WS message', err);
            }
        };

        ws.onerror = (err) => console.error('WebSocket error', err);

        return () => {
            ws.close();
            setSocket(null);
        };
    }, [activeChat]);

    // Auto scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (socket && input.trim()) {
            socket.send(
                JSON.stringify({
                    message: input,
                    user_id: user?.id,
                })
            );
            setInput('');
            console.log("Sending message", { message: input, user_id: user?.id });

        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="navbar bg-base-100 shadow-sm px-4">
                <span className="font-bold text-lg">{activeChat?.name || 'Chat'}</span>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {Array.isArray(messages) &&
                    messages.map((msg, idx) => {
                        const senderId = msg?.sender?.id;
                        const senderName = msg?.sender?.username || 'Unknown';
                        const isuser = senderId === user?.id;

                        return (
                            <div
                                key={idx}
                                className={`chat ${isuser ? 'chat-end' : 'chat-start'}`}
                            >
                                <div className="chat-header opacity-50 text-xs mb-1">
                                    {senderName}
                                </div>
                                <div
                                    className={`chat-bubble ${isuser
                                            ? 'chat-bubble-primary'
                                            : 'chat-bubble-ghost bg-white border'
                                        }`}
                                >
                                    {msg?.content}
                                </div>
                            </div>
                        );
                    })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-base-100 flex gap-2">
                <input
                    className="input input-bordered flex-1"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="btn btn-primary" onClick={handleSend}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;