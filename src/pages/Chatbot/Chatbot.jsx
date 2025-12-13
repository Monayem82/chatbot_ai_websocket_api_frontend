import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// Replace with your actual LLM API endpoint
const CHAT_API_URL = 'http://127.0.0.1:8000/text-generate-hugging-face/generate/'; 

// Initial message structure
const initialMessages = [
    { type: 'ai', text: 'Hello! I am an AI assistant. Feel free to ask me anything.' },
];

const Chatbot = () => {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false); 
    const messagesEndRef = useRef(null);

    // Scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Effect hook to trigger scroll on message update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        const userMessage = input.trim();
        if (!userMessage) return; // Handle empty message

        // 1. Add User Message
        setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
        setInput(''); 
        setIsTyping(true);

        try {
            const apiPayload = {
                prompt: userMessage,
                // Sending context (last few messages) is crucial for conversation flow
                history: messages.slice(-5).map(msg => ({ 
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }))
            };

            const response = await axios.post(CHAT_API_URL, apiPayload);
            const aiResponseText = response.data.generated_text || "Sorry, I couldn't process that request.";
            
            // 2. Add AI Response
            setMessages(prev => [...prev, { type: 'ai', text: aiResponseText }]);

        } catch (error) {
            console.error('Chat API Error:', error);
            const errorMessage = error.response?.data?.detail || "Error: Failed to connect to the AI service.";
            setMessages(prev => [...prev, { type: 'ai', text: errorMessage }]);
            
        } finally {
            setIsTyping(false); 
        }
    };

    // --- Message Bubble Component with Tailwind/Daisy UI classes ---
    const MessageBubble = ({ type, text }) => {
        const isUser = type === 'user';
        
        // Daisy UI classes used: chat, chat-start/chat-end, chat-bubble
        return (
            <div className={`chat ${isUser ? 'chat-end' : 'chat-start'} max-w-4xl mx-auto`}>
                {/* Optional: Add an avatar here for a complete look */}
                {/* <div className="chat-image avatar"><div className="w-10 rounded-full">{...}</div></div> */}
                
                {/* The Message Bubble */}
                <div className={`chat-bubble shadow-md whitespace-pre-wrap ${
                    isUser 
                    ? 'chat-bubble-primary text-white' // User bubble (e.g., blue)
                    : 'chat-bubble-neutral text-gray-800 bg-gray-200' // AI bubble (e.g., light gray)
                }`}>
                    {text}
                </div>
            </div>
        );
    };

    // --- Typing Indicator Component (Daisy UI component) ---
    const TypingIndicator = () => (
        <div className="chat chat-start max-w-4xl mx-auto">
            <div className="chat-bubble chat-bubble-neutral bg-gray-200 shadow-md">
                {/* Daisy UI 'loading' component is perfect for this */}
                <span className="loading loading-dots loading-sm text-gray-600"></span>
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col h-screen bg-base-100">
            {/* Header (Daisy UI Navbar) */}
            <header className="navbar bg-base-300 shadow-lg sticky top-0 z-10">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-xl font-bold"> AI Chat Assistant</h1>
                </div>
            </header>

            {/* Chat Area (Scrollable) */}
            <main className="flex-grow overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} type={msg.type} text={msg.text} />
                    ))}
                    
                    {/* Show Typing Indicator */}
                    {isTyping && <TypingIndicator />}
                    
                    {/* Scroll Target */}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Form (Sticky Footer) */}
            <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
                <div className="container mx-auto max-w-4xl">
                    <form onSubmit={handleSendMessage} className="flex space-x-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isTyping}
                            // Daisy UI input class
                            className="input input-bordered input-lg flex-grow shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button 
                            type="submit" 
                            disabled={isTyping || input.trim() === ''}
                            // Daisy UI button classes
                            className="btn btn-primary btn-lg shadow-md"
                        >
                            {/* Use a simple loading spinner if busy */}
                            {isTyping ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                'Send'
                            )}
                        </button>
                    </form>
                </div>
            </footer>
        </div>
    );
};

export default Chatbot;