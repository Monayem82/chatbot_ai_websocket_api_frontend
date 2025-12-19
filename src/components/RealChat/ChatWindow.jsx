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

    // --- Media States ---
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);

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

    // --- File & Voice Logic ---

    const uploadFileMessage = async (file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('group_id', activeChat.id);
        formData.append('message_type', type);

        try {
            await api.post('chatapp-ws/api/upload-file/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) uploadFileMessage(file, 'image');
    };

    const handleVoiceToggle = async () => {
        if (isRecording) {
            // Stop Recording
            if (mediaRecorder) {
                mediaRecorder.stop();
                setIsRecording(false);
            }
        } else {
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                let chunks = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    uploadFileMessage(blob, 'audio');
                    stream.getTracks().forEach(track => track.stop()); // মাইক্রোফোন বন্ধ করা
                };
                recorder.start();
                setMediaRecorder(recorder);
                setIsRecording(true);
            } catch (err) {
                alert("Microphone access denied! ");
                console.log(err)
            }
        }
    };

    // --- Existing Logic ---
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
            {/* Header */}
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
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/20">
                {messages.map((msg, i) => {
                    const isMe = msg.sender.id === currentUser.id;
                    const isSeen = msg.read_by?.some(u => u.id !== currentUser.id);

                    return (
                        <div key={i} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
                            <div className="chat-header mb-1 gap-2 flex items-center opacity-60">
                                <span className="text-[11px] font-bold">{msg.sender.username}</span>
                                <time className="text-[9px] font-medium">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </time>
                            </div>

                            <div className={`chat-bubble py-2.5 px-4 text-[14px] shadow-sm font-medium ${
                                isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-base-content rounded-tl-none border border-base-200'
                            }`}>
                                {msg.message_type === 'text' && <span>{msg.content}</span>}
                                
                                {msg.message_type === 'image' && (
                                    <img src={msg.image} alt="Sent" className="max-w-[220px] rounded-lg cursor-pointer shadow-sm border border-base-300/50" onClick={() => window.open(msg.image, '_blank')} />
                                )}

                                {msg.message_type === 'audio' && (
                                    <audio controls className="w-48 h-9 mt-1 accent-primary">
                                        <source src={msg.audio} type="audio/webm" />
                                    </audio>
                                )}
                            </div>
                            
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
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-base-100 border-t border-base-300">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {/* Image Button */}
                        <label className="btn btn-circle btn-ghost btn-sm text-primary cursor-pointer">
                            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                        </label>
                        {/* Voice Toggle Button */}
                        <button 
                            onClick={handleVoiceToggle}
                            className={`btn btn-circle btn-sm ${isRecording ? 'btn-error animate-pulse text-white shadow-lg' : 'btn-ghost text-primary'}`}
                        >
                            {isRecording ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 flex items-center gap-2 bg-base-200 rounded-full px-4 py-1 focus-within:ring-1 ring-primary/30 transition-all">
                        <input
                            className="bg-transparent border-none outline-none flex-1 py-2.5 px-1 text-[14px] text-base-content"
                            placeholder={isRecording ? "Recording voice..." : "Type a message..."}
                            value={input}
                            disabled={isRecording}
                            onChange={handleTyping}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button 
                            className={`btn btn-circle btn-sm border-none transition-all ${input.trim() ? 'bg-primary text-white shadow-md' : 'btn-ghost opacity-20'}`}
                            onClick={sendMessage}
                            disabled={!input.trim() || isRecording}
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

//     // --- নতুন স্টেটসমূহ (ভয়েস রেকর্ডিং এর জন্য) ---
//     const [isRecording, setIsRecording] = useState(false);
//     const [mediaRecorder, setMediaRecorder] = useState(null);

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

//     // --- নতুন ফাংশনসমূহ (ইমেজ ও ভয়েস হ্যান্ডলিং) ---

//     const uploadFileMessage = async (file, type) => {
//         const formData = new FormData();
//         formData.append('file', file);
//         formData.append('group_id', activeChat.id);
//         formData.append('message_type', type);

//         try {
//             // এটি আপনার নতুন APIView কে কল করবে
//             await api.post('chatapp-ws/api/upload-file/', formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//         } catch (err) {
//             console.error("File upload failed:", err);
//         }
//     };

//     const handleImageChange = (e) => {
//         const file = e.target.files[0];
//         if (file) uploadFileMessage(file, 'image');
//     };

//     const startRecording = async () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             const recorder = new MediaRecorder(stream);
//             let chunks = [];
//             recorder.ondataavailable = (e) => chunks.push(e.data);
//             recorder.onstop = () => {
//                 const blob = new Blob(chunks, { type: 'audio/webm' });
//                 uploadFileMessage(blob, 'audio');
//             };
//             recorder.start();
//             setMediaRecorder(recorder);
//             setIsRecording(true);
//         } catch (err) {
//             alert("Microphone access denied! and error is =",err);
//         }
//     };

//     const stopRecording = () => {
//         if (mediaRecorder) {
//             mediaRecorder.stop();
//             setIsRecording(false);
//         }
//     };

//     // --- আগের ফাংশনসমূহ (অপরিবর্তিত) ---
//     const handleTyping = (e) => {
//         setInput(e.target.value);
//         if (socket && socket.readyState === WebSocket.OPEN) {
//             socket.send(JSON.stringify({ 'type': 'typing', 'username': currentUser.username }));
//         }
//     };

//     const sendMessage = () => {
//         if (socket && socket.readyState === WebSocket.OPEN && input.trim()) {
//             socket.send(JSON.stringify({ 'message': input }));
//             setInput("");
//         }
//     };

//     return (
//         <div className="flex flex-col h-full bg-base-100 relative overflow-hidden">
//             {/* --- Header (অপরিবর্তিত) --- */}
//             <div className="navbar bg-base-100 border-b border-base-300 px-4 py-2 z-30 shadow-sm">
//                 <div className="flex-1 gap-3">
//                     <div className="avatar placeholder online">
//                         <div className="bg-primary text-primary-content rounded-full w-10 ring-2 ring-primary ring-offset-2">
//                             <span className="text-xl font-bold">{chatDisplayName[0].toUpperCase()}</span>
//                         </div>
//                     </div>
//                     <div>
//                         <h2 className="font-bold text-sm text-base-content leading-tight">{chatDisplayName}</h2>
//                         <p className="text-[10px] text-primary font-bold">
//                             {isTyping ? `${typingUser} is typing...` : (activeChat.is_group ? `${activeChat.members.length} Members` : 'Active Now')}
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             {/* --- Message Body (ইমেজ ও অডিও সাপোর্ট সহ আপডেট) --- */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/20">
//                 {messages.map((msg, i) => {
//                     const isMe = msg.sender.id === currentUser.id;
//                     const isSeen = msg.read_by?.some(u => u.id !== currentUser.id);

//                     return (
//                         <div key={i} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
//                             <div className="chat-header mb-1 gap-2 flex items-center opacity-60">
//                                 <span className="text-[11px] font-bold">{msg.sender.username}</span>
//                                 <time className="text-[9px] font-medium">
//                                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                 </time>
//                             </div>

//                             <div className={`chat-bubble py-2.5 px-4 text-[14px] shadow-sm font-medium ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-base-content rounded-tl-none border border-base-200'
//                                 }`}>
//                                 {/* টাইপ অনুযায়ী কন্টেন্ট দেখানো */}
//                                 {msg.message_type === 'text' && <span>{msg.content}</span>}

//                                 {msg.message_type === 'image' && (
//                                     <img src={msg.image} alt="Sent" className="max-w-[200px] rounded-lg cursor-pointer shadow-sm" onClick={() => window.open(msg.image, '_blank')} />
//                                 )}

//                                 {msg.message_type === 'audio' && (
//                                     <audio controls className="w-48 h-8 mt-1">
//                                         <source src={msg.audio} type="audio/webm" />
//                                     </audio>
//                                 )}
//                             </div>

//                             {isMe && (
//                                 <div className="chat-footer opacity-80 pt-1 flex justify-end">
//                                     {isSeen ? (
//                                         <div className="flex items-center text-blue-500">
//                                             <span className="text-[9px] mr-1 font-bold">Seen</span>
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
//                 <div ref={scrollRef} />
//             </div>

//             {/* --- Input Area (বাটনগুলো কার্যকর করা হয়েছে) --- */}
//             <div className="p-3 bg-base-100 border-t border-base-300">
//                 <div className="flex items-center gap-2">
//                     <div className="flex gap-1">
//                         {/* ইমেজ বাটন */}
//                         <label className="btn btn-circle btn-ghost btn-sm text-primary cursor-pointer">
//                             <input type="file" hidden accept="image/*" onChange={handleImageChange} />
//                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
//                         </label>
//                         {/* ভয়েস বাটন (চেপে ধরলে রেকর্ড হবে) */}
//                         <button
//                             onMouseDown={startRecording}
//                             onMouseUp={stopRecording}
//                             className={`btn btn-circle btn-sm ${isRecording ? 'btn-error animate-pulse text-white' : 'btn-ghost text-primary'}`}
//                         >
//                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
//                         </button>
//                     </div>

//                     <div className="flex-1 flex items-center gap-2 bg-base-200 rounded-full px-4 py-1 focus-within:ring-1 ring-primary/30 transition-all">
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