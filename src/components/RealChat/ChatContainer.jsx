import React, { useState, useContext } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import CreateGroupModal from './CreateGroupModal';
import { AuthContext } from '../../context/AuthContext';
// আপনার Context এর নাম অনুযায়ী AuthContext ইমপোর্ট করুন
// import { AuthContext } from '../../context/AuthContext'; 

const ChatContainer = () => {
    const [activeChat, setActiveChat] = useState(null);
    const { user } = useContext(AuthContext); // Context থেকে ইউজার ডাটা
    // const user = JSON.parse(localStorage.getItem('user')); // অল্টারনেটিভ

    return (
        <div className="flex h-[calc(100vh-64px)] w-full">
            <div className="w-1/4 min-w-[300px]">
                <ChatSidebar setActiveChat={setActiveChat} activeChat={activeChat} />
            </div>
            <div className="flex-1 h-full">
                {activeChat ? (
                    <ChatWindow activeChat={activeChat} currentUser={user} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 italic">
                        Select a conversation to start messaging
                    </div>
                )}
            </div>
            <CreateGroupModal />
        </div>
    );
};

export default ChatContainer;