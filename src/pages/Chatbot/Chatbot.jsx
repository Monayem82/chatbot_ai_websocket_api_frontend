import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const CHAT_API_URL = 'http://127.0.0.1:8000/text-generate-hugging-face/generate/';
const REFRESH_URL = 'http://127.0.0.1:8000/auth-info/api/token/refresh/';

const apiClient = axios.create({
  baseURL: CHAT_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        const refreshResponse = await axios.post(REFRESH_URL, { token: refreshToken });
        const newAccessToken = refreshResponse.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(error.config);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const initialMessages = [
  { type: 'ai', text: 'Hello! I am an AI assistant. Feel free to ask me anything.' },
];

const Chatbot = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiPayload = {
        prompt: userMessage,
        history: messages.slice(-5).map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
      };

      const response = await apiClient.post('/', apiPayload);
      const aiResponseText =
        response.data.generated_text || 'Sorry, I could not process that request.';

      setMessages((prev) => [...prev, { type: 'ai', text: aiResponseText }]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || 'Error: Failed to connect to the AI service.';
      setMessages((prev) => [...prev, { type: 'ai', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const MessageBubble = ({ type, text }) => {
    const isUser = type === 'user';
    return (
      <div
        className={`chat ${isUser ? 'chat-end' : 'chat-start'} max-w-2xl`}
      >
        <div
          className={`chat-bubble shadow-md whitespace-pre-wrap ${
            isUser
              ? 'chat-bubble-primary text-white'
              : 'chat-bubble-neutral text-gray-800 bg-gray-200'
          }`}
        >
          {text}
        </div>
      </div>
    );
  };

  const TypingIndicator = () => (
    <div className="chat chat-start max-w-2xl">
      <div className="chat-bubble chat-bubble-neutral bg-gray-200 shadow-md">
        <span className="loading loading-dots loading-sm text-gray-600"></span>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center h-[90vh] bg-base-200">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] bg-base-100 rounded-lg shadow-lg">
        {/* Header */}
        <header className="navbar bg-base-300 shadow-md rounded-t-lg">
          <div className="mx-auto">
            <h1 className="text-xl font-bold">AI Chat Assistant</h1>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-grow overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <MessageBubble key={index} type={msg.type} text={msg.text} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Form */}
        <footer className="bg-white border-t border-gray-200 p-4 rounded-b-lg">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isTyping}
              className="input input-bordered input-lg flex-grow shadow-md"
            />
            <button
              type="submit"
              disabled={isTyping || input.trim() === ''}
              className="btn btn-primary btn-lg shadow-md"
            >
              {isTyping ? '...' : 'Send'}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;