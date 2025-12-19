import React, { useState, useEffect, useRef } from 'react';
import api from '../../context/api';

const ChatWindow = ({ activeChat, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState(null);
    const scrollRef = useRef();

    // ১. মেসেজ হিস্ট্রি ও WebSocket কানেকশন
    useEffect(() => {
        if (!activeChat) return;
        
        // হিস্ট্রি লোড
        api.get(`chatapp-ws/api/messages/${activeChat.id}/`).then(res => setMessages(res.data));

        // WebSocket ওপেন (Token সহ)
        const token = localStorage.getItem('accessToken');
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${activeChat.id}/?token=${token}`);

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages(prev => [...prev, data]);
            setSocket(ws);
        };

        // setSocket(ws);
        return () => ws.close(); // রুম বদলালে কানেকশন বন্ধ
    }, [activeChat]);

    // ২. অটো স্ক্রল
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (socket && input.trim()) {
            socket.send(JSON.stringify({ 'message': input }));
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full bg-base-100">
            {/* Header */}
            <div className="navbar border-b border-base-300 px-4">
                <div className="flex-1 font-bold">{activeChat.group_name || "Private Chat"}</div>
                <div className="flex-none"><button className="btn btn-ghost btn-sm">Info</button></div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                {messages.map((msg, i) => (
                    <div key={i} className={`chat ${msg.sender.id === currentUser.id ? 'chat-end' : 'chat-start'}`}>
                        <div className="chat-header opacity-50 text-xs mb-1">{msg.sender.username}</div>
                        <div className={`chat-bubble ${msg.sender.id === currentUser.id ? 'chat-bubble-primary' : 'chat-bubble-base-100 shadow-md border'}`}>
                            {msg.content}
                        </div>
                        <div className="chat-footer opacity-50 text-[10px] mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-base-300 flex gap-2">
                <input 
                    className="input input-bordered flex-1" 
                    placeholder="Type a message..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn btn-primary" onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatWindow;