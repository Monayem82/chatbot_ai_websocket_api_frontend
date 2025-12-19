import React, { useEffect, useState } from 'react';
import api from '../../context/api'; // আপনার api.js এর পাথ অনুযায়ী ঠিক করুন

const ChatSidebar = ({ setActiveChat, activeChat }) => {
    const [chats, setChats] = useState([]); // ইনবক্স লিস্ট
    const [users, setUsers] = useState([]); // সব ইউজার (নতুন চ্যাটের জন্য)

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [chatRes, userRes] = await Promise.all([
                    api.get('chatapp-ws/api/chats/'),
                    api.get('chatapp-ws/api/users/')
                ]);
                setChats(chatRes.data);
                setUsers(userRes.data);
            } catch (err) { console.error("Error loading sidebar", err); }
        };
        fetchInitialData();
    }, []);

    const startPrivateChat = async (userId) => {
        try {
            const res = await api.post('chatapp-ws/api/private-chat/', { user_id: userId });
            setActiveChat(res.data); // নতুন চ্যাট রুম সেট করা
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex flex-col h-full bg-base-100 border-r border-base-300 overflow-y-auto">
            <div className="p-4 font-bold text-xl border-b border-base-300 flex justify-between">
                Chats
                <button className="btn btn-circle btn-xs btn-outline" onClick={() => document.getElementById('group_modal').showModal()}>+</button>
            </div>

            {/* Active Inbox */}
            <div className="p-2">
                <h3 className="text-xs font-bold opacity-50 px-2 my-2 uppercase">Recent</h3>
                {chats.map(chat => (
                    <div 
                        key={chat.id} 
                        onClick={() => setActiveChat(chat)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-base-200 ${activeChat?.id === chat.id ? 'bg-primary text-primary-content' : ''}`}
                    >
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-10">
                                <span>{chat.is_group ? 'G' : chat.group_name?.[0] || 'P'}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold truncate">{chat.group_name || "Private Chat"}</p>
                            {chat.last_message && <p className="text-xs truncate opacity-70">{chat.last_message.content}</p>}
                        </div>
                        {chat.unread_count > 0 && <span className="badge badge-secondary badge-sm">{chat.unread_count}</span>}
                    </div>
                ))}
            </div>

            {/* All Users (Messenger 'Discover' style) */}
            <div className="p-2 mt-4">
                <h3 className="text-xs font-bold opacity-50 px-2 my-2 uppercase">Suggested Users</h3>
                {users.map(u => (
                    <div key={u.id} onClick={() => startPrivateChat(u.id)} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer">
                        <div className={`avatar ${u.is_online ? 'online' : 'offline'}`}>
                            <div className="w-8 rounded-full bg-slate-300">
                                <span className="flex items-center justify-center h-full uppercase">{u.username[0]}</span>
                            </div>
                        </div>
                        <span className="text-sm">{u.username}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSidebar;