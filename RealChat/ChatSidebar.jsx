import React, { useContext, useEffect, useState, useCallback } from 'react';
import api from '../../context/api';
import { AuthContext } from '../../context/AuthContext';

const ChatSidebar = ({ setActiveChat, activeChat }) => {
    const [chats, setChats] = useState([]); 
    const [users, setUsers] = useState([]); 
    const [isInitialLoading, setIsInitialLoading] = useState(true); // শুধু প্রথমবার লোডিং দেখাবে

    const { user: currentUser } = useContext(AuthContext);

    const fetchData = useCallback(async (showLoading = false) => {
        if (showLoading) setIsInitialLoading(true);
        try {
            const [chatRes, userRes] = await Promise.all([
                api.get('chatapp-ws/api/chats/'),
                api.get('chatapp-ws/api/users/')
            ]);

            // ৩ নম্বর পয়েন্ট: টাইমস্ট্যাম্প অনুযায়ী সর্টিং (নতুন মেসেজ আসা চ্যাট উপরে যাবে)
            const sortedChats = chatRes.data.sort((a, b) => {
                const timeA = a.last_message ? new Date(a.last_message.timestamp) : new Date(a.created_at);
                const timeB = b.last_message ? new Date(b.last_message.timestamp) : new Date(b.created_at);
                return timeB - timeA;
            });

            setChats(sortedChats);
            setUsers(userRes.data);
        } catch (err) {
            console.error("Error loading sidebar", err);
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(true); // প্রথমবার লোডার সহ
        const interval = setInterval(() => fetchData(false), 5000); // প্রতি ৫ সেকেন্ডে ব্যাকগ্রাউন্ডে আপডেট
        return () => clearInterval(interval);
    }, [fetchData]);

    const startPrivateChat = async (userId) => {
        try {
            const res = await api.post('chatapp-ws/api/private-chat/', { user_id: userId });
            setActiveChat(res.data);
            fetchData(false); // চ্যাট শুরু হলে একবার ডাটা রিফ্রেশ
        } catch (err) { console.error(err); }
    };

    if (isInitialLoading) return <div className="p-4 text-center"><span className="loading loading-dots loading-md text-primary"></span></div>;

    return (
        <div className="flex flex-col h-full bg-base-100 border-r border-base-300 overflow-y-auto">
            {/* Header */}
            <div className="p-4 font-bold text-xl border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-100 z-10 backdrop-blur-md bg-opacity-80">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Fun Your Friend</span>
                <button
                    className="btn btn-circle btn-xs btn-outline btn-primary"
                    onClick={() => document.getElementById('group_modal').showModal()}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>

            {/* Recent Conversations */}
            <div className="p-2">
                <h3 className="text-[10px] font-black opacity-40 px-3 my-3 uppercase tracking-[2px]">Recent Chats</h3>
                <div className="space-y-1">
                    {chats.map(chat => {
                        let displayName = chat.group_name;
                        let isOnline = false;
                        
                        if (!chat.is_group) {
                            const otherUser = chat.members.find(m => m.id !== currentUser.id);
                            displayName = otherUser ? otherUser.username : "Unknown User";
                            isOnline = otherUser ? otherUser.is_online : false;
                        }

                        return (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeChat?.id === chat.id ? 'bg-primary text-primary-content shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:bg-base-200'}`}
                            >
                                {/* ২ নম্বর পয়েন্ট: গ্রিন ডট আইকন */}
                                <div className={`avatar ${isOnline ? 'online' : 'offline'} placeholder`}>
                                    <div className={`bg-neutral-focus text-neutral-content rounded-full w-12 transition-transform group-hover:scale-105`}>
                                        <span className="text-lg font-bold">{displayName[0].toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold truncate text-sm">{displayName}</p>
                                    <p className={`text-xs truncate ${activeChat?.id === chat.id ? 'opacity-90' : 'opacity-50'}`}>
                                        {chat.last_message ? (
                                            <>
                                                <span className="font-medium">{chat.last_message.sender === currentUser.username ? 'You: ' : ''}</span>
                                                {chat.last_message.content}
                                            </>
                                        ) : "Start a conversation"}
                                    </p>
                                </div>
                                {chat.unread_count > 0 && (
                                    <div className="badge badge-secondary badge-sm animate-bounce">{chat.unread_count}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="divider px-4 opacity-10"></div>

            {/* Suggested Users / Active Friends Section */}
            <div className="p-2">
                <h3 className="text-[10px] font-black opacity-40 px-3 my-3 uppercase tracking-[2px]">Suggested Users</h3>
                <div className="space-y-1">
                    {users.map(u => (
                        <div
                            key={u.id}
                            onClick={() => startPrivateChat(u.id)}
                            className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-2xl cursor-pointer transition-all active:scale-95 group"
                        >
                            {/* প্রোফাইল পিকচার এবং তার উপরে স্ট্যাটাস ডট */}
                            <div className={`avatar ${u.is_online ? 'online' : 'offline'}`}>
                                <div className="w-10 rounded-full bg-gradient-to-tr from-base-300 to-base-100 flex items-center justify-center font-bold text-primary">
                                    {u.username[0].toUpperCase()}
                                </div>
                            </div>

                            {/* নাম এবং স্ট্যাটাস টেক্সট উইথ ডট */}
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
                                    {u.username}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {/* ডট লজিক: সবুজ যখন একটিভ, ধূসর যখন অফলাইন */}
                                    <span className={`h-2 w-2 rounded-full transition-colors duration-500 ${u.is_online ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></span>
                                    
                                    <p className="text-[10px] font-medium opacity-60 tracking-tight">
                                        {u.is_online ? 'Active now' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;






// import React, { useContext, useEffect, useState } from 'react';
// import api from '../../context/api';
// import { AuthContext } from '../../context/AuthContext';

// const ChatSidebar = ({ setActiveChat, activeChat }) => {
//     const [chats, setChats] = useState([]); // ইনবক্স লিস্ট (Recent Chats)
//     const [users, setUsers] = useState([]); // সব ইউজার (Suggested Users)
//     const [loading, setLoading] = useState(true);

//     // ১. আপনার নিজের তথ্য (নাম বের করার জন্য প্রয়োজন)
//     // const currentUser = JSON.parse(localStorage.getItem('user'));
//     let { user } = useContext(AuthContext)
//     const currentUser = user

//     useEffect(() => {
//         const fetchInitialData = async () => {
//             try {
//                 setLoading(true);
//                 const [chatRes, userRes] = await Promise.all([
//                     api.get('chatapp-ws/api/chats/'),
//                     api.get('chatapp-ws/api/users/')
//                 ]);
//                 setChats(chatRes.data);
//                 setUsers(userRes.data);
//             } catch (err) {
//                 console.error("Error loading sidebar", err);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchInitialData();
//         const interval = setInterval(fetchInitialData, 5000);
//         return () => clearInterval(interval);
        
//     }, []);

//     // ২. প্রাইভেট চ্যাট শুরু করার লজিক
//     const startPrivateChat = async (userId) => {
//         try {
//             const res = await api.post('chatapp-ws/api/private-chat/', { user_id: userId });
//             setActiveChat(res.data);
//             // চ্যাট লিস্টে যদি নতুন চ্যাটটি না থাকে তবে তা রিফ্রেশ করা ভালো
//             if (!chats.find(c => c.id === res.data.id)) {
//                 setChats([res.data, ...chats]);
//             }
//         } catch (err) { console.error(err); }
//     };

//     if (loading) return <div className="p-4 text-center"><span className="loading loading-dots loading-md"></span></div>;

//     return (
//         <div className="flex flex-col h-full bg-base-100 border-r border-base-300 overflow-y-auto overflow-x-hidden">
//             {/* Sidebar Header */}
//             <div className="p-4 font-bold text-xl border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-100 z-10">
//                 <span>Chats</span>
//                 <button
//                     className="btn btn-circle btn-xs btn-outline btn-primary"
//                     onClick={() => document.getElementById('group_modal').showModal()}
//                 >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
//                 </button>
//             </div>

//             {/* Recent Conversations (ইনবক্স লিস্ট) */}
//             <div className="p-2">
//                 <h3 className="text-xs font-bold opacity-50 px-2 my-3 uppercase tracking-wider">Recent</h3>
//                 <div className="space-y-1">
//                     {chats.map(chat => {
//                         // লজিক: প্রাইভেট চ্যাট হলে অন্য ইউজারের নাম বের করা
//                         let displayName = chat.group_name;
//                         if (!chat.is_group) {
//                             const otherUser = chat.members.find(m => m.id !== currentUser.id);
//                             displayName = otherUser ? otherUser.username : "Unknown User";
//                         }

//                         return (
//                             <div
//                                 key={chat.id}
//                                 onClick={() => setActiveChat(chat)}
//                                 className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-base-200 ${activeChat?.id === chat.id ? 'bg-primary text-primary-content shadow-md' : ''}`}
//                             >
//                                 <div className="avatar placeholder">
//                                     <div className={`bg-neutral text-neutral-content rounded-full w-12 border-2 ${activeChat?.id === chat.id ? 'border-primary-content' : 'border-transparent'}`}>
//                                         <span className="text-lg font-bold">{displayName[0].toUpperCase()}</span>
//                                     </div>
//                                 </div>
//                                 <div className="flex-1 overflow-hidden">
//                                     <p className="font-bold truncate text-sm">{displayName}</p>
//                                     {chat.last_message ? (
//                                         <p className={`text-xs truncate ${activeChat?.id === chat.id ? 'opacity-90' : 'opacity-60'}`}>
//                                             <span className="font-semibold">
//                                                 {chat.last_message.sender === currentUser.username ? 'You: ' : ''}
//                                             </span>
//                                             {chat.last_message.content}
//                                         </p>
//                                     ) : (
//                                         <p className="text-xs italic opacity-50">No messages yet</p>
//                                     )}
//                                 </div>
//                                 {chat.unread_count > 0 && (
//                                     <div className="badge badge-secondary badge-sm font-bold">{chat.unread_count}</div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>

//             <div className="divider px-4"></div>

//             {/* Suggested Users (সব ইউজারদের লিস্ট) */}
//             <div className="p-2">
//                 <h3 className="text-xs font-bold opacity-50 px-2 my-3 uppercase tracking-wider">Suggested Users</h3>
//                 <div className="space-y-1">
//                     {users.map(u => (
//                         <div
//                             key={u.id}
//                             onClick={() => startPrivateChat(u.id)}
//                             className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-xl cursor-pointer transition-all active:scale-95"
//                         >
//                             <div className={`avatar ${u.is_online ? 'online' : 'offline'}`}>
//                                 <div className="w-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
//                                     <span className="flex items-center justify-center h-full w-full">{u.username[0].toUpperCase()}</span>
//                                 </div>
//                             </div>
//                             <div className="flex-1">
//                                 <p className="text-sm font-medium">{u.username}</p>
//                                 <p className="text-[10px] opacity-50">{u.is_online ? 'Active Now' : 'Offline'}</p>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ChatSidebar;






