import React, { useState, useEffect, useRef } from 'react';
import api from '../../context/api';

const ChatWindow = ({ activeChat, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState("");
    const scrollRef = useRef();
    const typingTimeoutRef = useRef(null);

    let chatDisplayName = activeChat.group_name;
    if (!activeChat.is_group) {
        const otherUser = activeChat.members.find(m => m.id !== currentUser.id);
        chatDisplayName = otherUser ? otherUser.username : "Private Chat";
    }

    useEffect(() => {
        if (!activeChat) return;

        api.get(`chatapp-ws/api/messages/${activeChat.id}/`).then(res => setMessages(res.data));

        const token = localStorage.getItem('accessToken');
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${activeChat.id}/?token=${token}`);

        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({ 'type': 'mark_read' }));
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            
            if (data.type === 'messages_read') {
                setMessages(prev => prev.map(msg => ({
                    ...msg,
                    read_by: [...(msg.read_by || []), { id: data.reader_id }]
                })));
            } else if (data.type === 'typing') {
                if (data.user_id !== currentUser.id) {
                    setTypingUser(data.username);
                    setIsTyping(true);
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
                }
            } else {
                // নতুন মেসেজ আসলে লিস্টে যোগ করা
                setMessages(prev => [...prev, data]);
                setIsTyping(false);
                if (data.sender.id !== currentUser.id) {
                    ws.send(JSON.stringify({ 'type': 'mark_read' }));
                }
            }
        };

        return () => ws.close();
    }, [activeChat, currentUser.id]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleTyping = (e) => {
        setInput(e.target.value);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 'type': 'typing', 'username': currentUser.username }));
        }
    };

    const sendMessage = () => {
        if (socket && socket.readyState === WebSocket.OPEN && input.trim()) {
            socket.send(JSON.stringify({ 'message': input }));
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full bg-base-100 relative overflow-hidden">
            {/* --- Header (With Call Icons) --- */}
            <div className="navbar bg-base-100 border-b border-base-300 px-4 py-2 z-30 shadow-sm">
                <div className="flex-1 gap-3">
                    <div className="avatar placeholder online">
                        <div className="bg-primary text-primary-content rounded-full w-10 ring-2 ring-primary ring-offset-2">
                            <span className="text-xl font-bold">{chatDisplayName[0].toUpperCase()}</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-base-content leading-tight">{chatDisplayName}</h2>
                        <p className="text-[10px] text-primary font-bold">
                            {isTyping ? `${typingUser} is typing...` : (activeChat.is_group ? `${activeChat.members.length} Members` : 'Active Now')}
                        </p>
                    </div>
                </div>
                <div className="flex-none gap-2">
                    <button className="btn btn-circle btn-ghost btn-sm text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                    </button>
                    <button className="btn btn-circle btn-ghost btn-sm text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    </button>
                </div>
            </div>

            {/* --- Message Body --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/20">
                {messages.map((msg, i) => {
                    const isMe = msg.sender.id === currentUser.id;
                    const isSeen = msg.read_by?.some(u => u.id !== currentUser.id);

                    return (
                        <div key={i} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                            {/* ১. প্রেরকের নাম ও সময় (HEADER) */}
                            <div className="chat-header mb-1 gap-2 flex items-center opacity-60">
                                <span className="text-[11px] font-bold">{msg.sender.username}</span>
                                <time className="text-[9px] font-medium">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </time>
                            </div>

                            {/* ২. মেসেজের টেক্সট (BUBBLE) */}
                            <div className={`chat-bubble py-2.5 px-4 text-[14px] shadow-sm font-medium ${
                                isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-base-content rounded-tl-none border border-base-200'
                            }`}>
                                {msg.content}
                            </div>
                            
                            {/* ৩. মেসেজ স্ট্যাটাস (FOOTER/TICK) */}
                            {isMe && (
                                <div className="chat-footer opacity-80 pt-1 flex justify-end">
                                    {isSeen ? (
                                        <div className="flex items-center text-blue-500">
                                            <span className="text-[9px] mr-1 font-bold">Seen</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 -mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                        </div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* --- Typing Dots Animation --- */}
                {isTyping && (
                    <div className="chat chat-start">
                        <div className="chat-header opacity-60 mb-1 text-[11px] font-bold">{typingUser} is typing</div>
                        <div className="chat-bubble bg-base-200 flex items-center gap-1.5 py-3 px-4 rounded-tl-none shadow-sm">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* --- Input Area with Media Icons --- */}
            <div className="p-3 bg-base-100 border-t border-base-300">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <button className="btn btn-circle btn-ghost btn-sm text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                        </button>
                        <button className="btn btn-circle btn-ghost btn-sm text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 flex items-center gap-2 bg-base-200 rounded-full px-4 py-1 focus-within:ring-1 ring-primary/30 transition-all">
                        <input
                            className="bg-transparent border-none outline-none flex-1 py-2.5 px-1 text-[14px] text-base-content"
                            placeholder="Type a message..."
                            value={input}
                            onChange={handleTyping}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button 
                            className={`btn btn-circle btn-sm border-none transition-all ${input.trim() ? 'bg-primary text-white shadow-md' : 'btn-ghost opacity-20'}`}
                            onClick={sendMessage}
                            disabled={!input.trim()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;




// import React, { useState, useEffect, useRef } from 'react';
// import api from '../../context/api';

// const ChatWindow = ({ activeChat, currentUser }) => {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState("");
//     const [socket, setSocket] = useState(null);
//     const [isTyping, setIsTyping] = useState(false);
//     const [typingUser, setTypingUser] = useState("");
//     const scrollRef = useRef();
//     const typingTimeoutRef = useRef(null);

//     let chatDisplayName = activeChat.group_name;
//     if (!activeChat.is_group) {
//         const otherUser = activeChat.members.find(m => m.id !== currentUser.id);
//         chatDisplayName = otherUser ? otherUser.username : "Private Chat";
//     }

//     useEffect(() => {
//         if (!activeChat) return;

//         api.get(`chatapp-ws/api/messages/${activeChat.id}/`).then(res => setMessages(res.data));

//         const token = localStorage.getItem('accessToken');
//         const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${activeChat.id}/?token=${token}`);

//         ws.onopen = () => {
//             setSocket(ws);
//             ws.send(JSON.stringify({ 'type': 'mark_read' }));
//         };

//         ws.onmessage = (e) => {
//             const data = JSON.parse(e.data);
            
//             if (data.type === 'messages_read') {
//                 setMessages(prev => prev.map(msg => ({
//                     ...msg,
//                     read_by: [...(msg.read_by || []), { id: data.reader_id }]
//                 })));
//             } else if (data.type === 'typing') {
//                 if (data.user_id !== currentUser.id) {
//                     setTypingUser(data.username);
//                     setIsTyping(true);
//                     clearTimeout(typingTimeoutRef.current);
//                     typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
//                 }
//             } else {
//                 setMessages(prev => [...prev, data]);
//                 setIsTyping(false);
//                 if (data.sender.id !== currentUser.id) {
//                     ws.send(JSON.stringify({ 'type': 'mark_read' }));
//                 }
//             }
//         };

//         return () => ws.close();
//     }, [activeChat, currentUser.id]);

//     useEffect(() => {
//         scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages, isTyping]);

//     const handleTyping = (e) => {
//         setInput(e.target.value);
//         if (socket && socket.readyState === WebSocket.OPEN) {
//             socket.send(JSON.stringify({ 'type': 'typing', 'username': currentUser.username }));
//         }
//     };

//     const sendMessage = () => {
//         // এখানে socket.readyState === WebSocket.OPEN চেকটি যুক্ত করুন
//         if (socket && socket.readyState === WebSocket.OPEN && input.trim()) {
//             socket.send(JSON.stringify({ 'message': input }));
//             setInput("");
//         } else {
//             console.error("সকেট কানেকশন নেই। পুনরায় চেষ্টা করুন বা পেজ রিফ্রেশ করুন।");
//             // আপনি চাইলে এখানে ইউজারকে একটি নোটিফিকেশনও দেখাতে পারেন
//         }
//     };

//     return (
//         <div className="flex flex-col h-full bg-base-100 relative overflow-hidden">
//             {/* --- Clear Header --- */}
//             <div className="navbar bg-base-100 border-b border-base-300 px-4 py-2 z-30">
//                 <div className="flex-1 gap-3">
//                     <div className="avatar placeholder online">
//                         <div className="bg-primary text-primary-content rounded-full w-10 ring-2 ring-primary ring-offset-2">
//                             <span className="text-xl font-bold">{chatDisplayName[0].toUpperCase()}</span>
//                         </div>
//                     </div>
//                     <div>
//                         <h2 className="font-bold text-md text-base-content">{chatDisplayName}</h2>
//                         <p className="text-[10px] text-primary font-bold">
//                             {isTyping ? `${typingUser} is typing...` : 'Active Now'}
//                         </p>
//                     </div>
//                 </div>
//                 <div className="flex-none gap-1">
//                     <button className="btn btn-circle btn-ghost btn-sm text-primary">
//                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
//                     </button>
//                     <button className="btn btn-circle btn-ghost btn-sm text-primary">
//                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
//                     </button>
//                 </div>
//             </div>

//             {/* --- Message Body (No blur on text) --- */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/40">
//                 {messages.map((msg, i) => {
//                     const isMe = msg.sender.id === currentUser.id;
//                     const isSeen = msg.read_by?.some(u => u.id !== currentUser.id);

//                     return (
//                         <div key={i} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
//                             <div className={`chat-bubble py-2.5 px-4 text-[14px] leading-relaxed shadow-sm ${
//                                 isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-base-content rounded-tl-none border border-base-200'
//                             }`}>
//                                 {msg.content}
//                             </div>
//                             {isMe && (
//                                 <div className="chat-footer opacity-80 pt-1 flex justify-end">
//                                     {isSeen ? (
//                                         <div className="flex items-center text-blue-500 font-bold">
//                                             <span className="text-[10px] mr-1">Seen</span>
//                                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 -mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
//                                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
//                                         </div>
//                                     ) : (
//                                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     );
//                 })}
                
//                 {/* --- Typing Indicator Fix --- */}
//                 {isTyping && (
//                     <div className="chat chat-start transition-opacity duration-300">
//                         <div className="chat-bubble bg-base-200 flex items-center gap-1.5 py-3 px-4 rounded-tl-none">
//                             <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
//                             <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
//                             <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
//                         </div>
//                     </div>
//                 )}
//                 <div ref={scrollRef} />
//             </div>

//             {/* --- Fixed Input Area --- */}
//             <div className="p-3 bg-base-100 border-t border-base-300">
//                 <div className="flex items-center gap-2">
//                     <div className="flex gap-1">
//                         <button className="btn btn-circle btn-ghost btn-sm text-primary">
//                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
//                         </button>
//                         <button className="btn btn-circle btn-ghost btn-sm text-primary">
//                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
//                         </button>
//                     </div>

//                     <div className="flex-1 flex items-center gap-2 bg-base-200 rounded-full px-4 py-1 focus-within:ring-2 ring-primary/20 transition-all">
//                         <input
//                             className="bg-transparent border-none outline-none flex-1 py-2.5 px-1 text-[14px] text-base-content"
//                             placeholder="Type a message..."
//                             value={input}
//                             onChange={handleTyping}
//                             onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//                         />
//                         <button 
//                             className={`btn btn-circle btn-sm border-none transition-all ${input.trim() ? 'bg-primary text-white shadow-md' : 'btn-ghost opacity-20'}`}
//                             onClick={sendMessage}
//                             disabled={!input.trim()}
//                         >
//                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" /></svg>
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ChatWindow;











// import React, { useState, useEffect, useRef } from 'react';
// import api from '../../context/api';

// const ChatWindow = ({ activeChat, currentUser }) => {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState("");
//     const [socket, setSocket] = useState(null);
//     const scrollRef = useRef();

//     let chatDisplayName = activeChat.group_name;
//     if (!activeChat.is_group) {
//         const otherUser = activeChat.members.find(m => m.id !== currentUser.id);
//         chatDisplayName = otherUser ? otherUser.username : "Private Chat";
//     }

//     useEffect(() => {
//         if (!activeChat) return;

//         api.get(`chatapp-ws/api/messages/${activeChat.id}/`).then(res => setMessages(res.data));

//         const token = localStorage.getItem('accessToken');
//         const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${activeChat.id}/?token=${token}`);

//         ws.onopen = () => {
//             setSocket(ws);
//             // চ্যাট ওপেন করলেই ব্যাকেন্ডকে জানানো যে আমি মেসেজগুলো পড়েছি
//             ws.send(JSON.stringify({ 'type': 'mark_read' }));
//         };

//         ws.onmessage = (e) => {
//             const data = JSON.parse(e.data);
            
//             // যদি টাইপ 'messages_read' হয়, তবে সব মেসেজের 'read_by' আপডেট করো
//             if (data.type === 'messages_read') {
//                 setMessages(prev => prev.map(msg => ({
//                     ...msg,
//                     read_by: [...(msg.read_by || []), { id: data.reader_id }]
//                 })));
//             } else {
//                 // নতুন মেসেজ আসলে লিস্টে যোগ করো
//                 setMessages(prev => [...prev, data]);
                
//                 // মেসেজটি যদি আমি না পাঠাই, তবে সেটা পঠিত হিসেবে মার্ক করার জন্য সিগন্যাল দাও
//                 if (data.sender.id !== currentUser.id) {
//                     ws.send(JSON.stringify({ 'type': 'mark_read' }));
//                 }
//             }
//         };

//         return () => ws.close();
//     }, [activeChat, currentUser.id]);

//     useEffect(() => {
//         scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     const sendMessage = () => {
//         if (socket && input.trim()) {
//             socket.send(JSON.stringify({ 'message': input }));
//             setInput("");
//         }
//     };

//     return (
//         <div className="flex flex-col h-full bg-base-100 shadow-2xl relative">
//             {/* Header */}
//             <div className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-20 border-b border-base-300 px-6 py-3">
//                 <div className="flex-1 gap-3">
//                     <div className="avatar placeholder">
//                         <div className="bg-primary text-primary-content rounded-full w-10 ring ring-primary ring-offset-base-100 ring-offset-2">
//                             <span className="text-xl font-bold">{chatDisplayName[0].toUpperCase()}</span>
//                         </div>
//                     </div>
//                     <div>
//                         <h2 className="font-black text-lg leading-none">{chatDisplayName}</h2>
//                         <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold mt-1">
//                             {activeChat.is_group ? `${activeChat.members.length} Members` : 'Active Conversation'}
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             {/* Message Body */}
//             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 dark:bg-slate-900/50">
//                 {messages.map((msg, i) => {
//                     const isMe = msg.sender.id === currentUser.id;
//                     // চেক করা হচ্ছে অন্য কেউ (রিসিভার) মেসেজটি দেখেছে কি না
//                     const isSeen = msg.read_by?.some(u => u.id !== currentUser.id);

//                     return (
//                         <div key={i} className={`chat ${isMe ? 'chat-end' : 'chat-start'} animate-fade-in-up`}>
//                             <div className="chat-image avatar">
//                                 <div className="w-8 rounded-full border border-primary/20">
//                                     <span className="flex items-center justify-center h-full bg-base-300 text-[10px] font-bold">
//                                         {msg.sender.username[0].toUpperCase()}
//                                     </span>
//                                 </div>
//                             </div>
//                             <div className="chat-header mb-1 gap-2 flex items-center opacity-60">
//                                 <span className="text-xs font-bold">{msg.sender.username}</span>
//                                 <time className="text-[9px] uppercase tracking-tighter">
//                                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                 </time>
//                             </div>
//                             <div className={`chat-bubble py-3 px-4 text-sm font-medium shadow-lg transition-transform hover:scale-[1.02] ${
//                                 isMe 
//                                 ? 'bg-gradient-to-br from-primary to-blue-600 text-primary-content rounded-tr-none' 
//                                 : 'bg-base-200 text-base-content rounded-tl-none border border-base-300'
//                             }`}>
//                                 {msg.content}
//                             </div>
                            
//                             {/* --- Tick Logic Start --- */}
//                             {isMe && (
//                                 <div className="chat-footer opacity-80 pt-1 flex justify-end">
//                                     {isSeen ? (
//                                         // ডাবল ব্লু টিক (Seen)
//                                         <div className="flex items-center">
//                                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-blue-500 -mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
//                                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
//                                         </div>
//                                     ) : (
//                                         // সিঙ্গেল গ্রে টিক (Sent)
//                                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
//                                     )}
//                                 </div>
//                             )}
//                             {/* --- Tick Logic End --- */}
//                         </div>
//                     );
//                 })}
//                 <div ref={scrollRef} />
//             </div>

//             {/* Input Area */}
//             <div className="p-4 bg-base-100/50 backdrop-blur-lg border-t border-base-300">
//                 <div className="flex items-center gap-2 bg-base-200 rounded-full px-4 py-1 shadow-inner focus-within:ring-2 ring-primary/30 transition-all">
//                     <input
//                         className="bg-transparent border-none outline-none flex-1 py-3 px-2 text-sm"
//                         placeholder="Type a message..."
//                         value={input}
//                         onChange={(e) => setInput(e.target.value)}
//                         onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//                     />
//                     <button 
//                         className={`btn btn-circle btn-sm border-none transition-all ${input.trim() ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/40' : 'btn-ghost opacity-30'}`}
//                         onClick={sendMessage}
//                         disabled={!input.trim()}
//                     >
//                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" /></svg>
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ChatWindow;












// import React, { useState, useEffect, useRef } from 'react';
// import api from '../../context/api';

// const ChatWindow = ({ activeChat, currentUser }) => {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState("");
//     const [socket, setSocket] = useState(null);
//     const scrollRef = useRef();

//     // ১. মেসেজ হিস্ট্রি ও WebSocket কানেকশন
//     useEffect(() => {
//         if (!activeChat) return;

//         // হিস্ট্রি লোড
//         api.get(`chatapp-ws/api/messages/${activeChat.id}/`).then(res => setMessages(res.data));

//         // WebSocket ওপেন (Token সহ)
//         const token = localStorage.getItem('accessToken');
//         const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${activeChat.id}/?token=${token}`);

//         ws.onopen = () => {
//             setSocket(ws); // ✅ safe: runs asynchronously after connection opens
//         };



//         // setSocket(ws);
//         ws.onmessage = (e) => {
//             const data = JSON.parse(e.data);
//             setMessages(prev => [...prev, data]);

//         };

//         // setSocket(ws);
//         return () => ws.close(); // রুম বদলালে কানেকশন বন্ধ
//     }, [activeChat]);

//     // ২. অটো স্ক্রল
//     useEffect(() => {
//         scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     const sendMessage = () => {
//         if (socket && input.trim()) {
//             socket.send(JSON.stringify({ 'message': input }));
//             setInput("");
//         }
//     };

//     return (
//         <div className="flex flex-col h-full bg-base-100">
//             {/* Header */}
//             <div className="navbar border-b border-base-300 px-4">
//                 <div className="flex-1 font-bold">{activeChat.group_name || "Private Chat"}</div>
//                 <div className="flex-none"><button className="btn btn-ghost btn-sm">Info</button></div>
//             </div>

//             {/* Messages Body */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
//                 {messages.map((msg, i) => (
//                     <div key={i} className={`chat ${msg.sender.id === currentUser.id ? 'chat-end' : 'chat-start'}`}>
//                         <div className="chat-header opacity-50 text-xs mb-1">{msg.sender.username}</div>
//                         <div className={`chat-bubble ${msg.sender.id === currentUser.id ? 'chat-bubble-primary' : 'chat-bubble-base-100 shadow-md border'}`}>
//                             {msg.content}
//                         </div>
//                         <div className="chat-footer opacity-50 text-[10px] mt-1">
//                             {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                         </div>
//                     </div>
//                 ))}
//                 <div ref={scrollRef} />
//             </div>

//             {/* Input */}
//             <div className="p-4 border-t border-base-300 flex gap-2">
//                 <input
//                     className="input input-bordered flex-1"
//                     placeholder="Type a message..."
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//                 />
//                 <button className="btn btn-primary" onClick={sendMessage}>Send</button>
//             </div>
//         </div>
//     );
// };

// export default ChatWindow;