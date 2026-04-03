import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io.connect("http://localhost:5000");

export default function ContactAdminModal({ employerId, companyName }) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    socket.emit("join_room", employerId);

    socket.on("receive_message", (data) => {
      setChatHistory((prev) => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, [employerId]);

  const sendMessage = () => {
    const messageData = {
      sender: companyName,
      content: message,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", messageData);
    setChatHistory((prev) => [...prev, messageData]);
    setMessage("");
  };

  return (
    <div className="fixed bottom-10 right-10 w-80 bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden">
      <div className="bg-blue-900 p-4 text-white font-bold flex justify-between">
        <span>Chat with Admin</span>
      </div>
      
      <div className="h-64 p-4 overflow-y-auto bg-slate-50 space-y-2">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`p-2 rounded-lg text-sm ${msg.sender === companyName ? "bg-blue-100 ml-auto" : "bg-white"}`}>
            <p className="font-bold text-[10px] text-slate-500">{msg.sender}</p>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 text-sm border-none focus:ring-0"
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
          Send
        </button>
      </div>
    </div>
  );
}