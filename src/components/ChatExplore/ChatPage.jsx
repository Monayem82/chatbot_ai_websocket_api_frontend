import { useState, useEffect } from 'react';
import Sidebar from '../ChatExplore/Sidebar';
import ChatWindow from '../ChatExplore/ChatWindow';
import api from '../../context/api.js';

const ChatPage = () => {
    const [activeChat, setActiveChat] = useState(null); // {id, type, name}
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true); // লোডিং স্টেট
    const [error, setError] = useState(null);    // এরর স্টেট

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // আপনার API এন্ডপয়েন্ট অনুযায়ী পাথগুলো চেক করে নিন
                const [usersRes, groupsRes] = await Promise.all([
                    api.get('chat-websoket/api/users/'), 
                    api.get('chat-websoket/groups/')
                ]);

                setUsers(usersRes.data);
                setGroups(groupsRes.data);
                setError(null);
            } catch (err) {
                console.error("Data fetching error:", err);
                setError("ডেটা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // লোডিং স্ক্রিন
    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] bg-base-200 overflow-hidden text-base-content">
            {/* Sidebar */}
            <div className="w-80 border-r border-base-300 bg-base-100 hidden md:block">
                <Sidebar 
                    users={users} 
                    groups={groups} 
                    setActiveChat={setActiveChat} 
                    activeChat={activeChat}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                {error ? (
                    <div className="flex-1 flex items-center justify-center text-error">
                        <p>{error}</p>
                    </div>
                ) : activeChat ? (
                    <ChatWindow activeChat={{activeChat,users}} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <div className="bg-base-300 p-6 rounded-full">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <p className="text-lg font-medium">চ্যাট শুরু করতে কাউকে সিলেক্ট করুন</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;