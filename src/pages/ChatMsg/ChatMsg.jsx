import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const ChatMsg = () => {
    const {user} =useContext(AuthContext)
    const [message, setMessage] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const socketRef = useRef(null);
    const chatEndRef = useRef(null);

    const username = user.username; // এখানে তোমার ইউজারনেম বসাও বা auth থেকে নাও

    useEffect(() => {
        const ws = new WebSocket("ws://127.0.0.1:8000/ws/chat/");
        socketRef.current = ws;

        ws.onopen = () => console.log("✅ Connected to Backend");

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.message) {
                    setChatLog((prev) => [
                        ...prev,
                        { text: data.message, sender: data.username },
                    ]);
                }
            } catch (err) {
                console.error("Invalid message format:", err);
            }
        };

        ws.onerror = (err) => console.error("WebSocket error:", err);

        return () => ws.close();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatLog]);

    const sendMessage = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ message, username }));
            setMessage("");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-base-200">
            <div className="card bg-base-100 shadow-xl w-full max-w-md">
                <div className="card-body">
                    <h2 className="text-2xl font-bold text-center mb-4">💬 Chat Room</h2>

                    {/* Chat Log */}
                    <div className="h-80 overflow-y-auto border rounded p-3 bg-gray-50">
                        {chatLog.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex mb-2 ${msg.sender === username ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div>
                                    
                                    <span
                                        className={`px-3 py-2 rounded-lg text-sm ${msg.sender === username
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-300 text-black"
                                            }`}
                                    >
                                        {msg.text}
                                    </span>
                                    <p className="text-xs my-1 text-gray-500">@user: {msg.sender}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input + Button */}
                    <div className="flex mt-4">
                        <input
                            type="text"
                            className="input input-bordered flex-1"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button
                            className="btn btn-primary ml-2"
                            onClick={sendMessage}
                            disabled={!message.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMsg;