import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { 
  Send as SendIcon, 
  MessageSquare as MsgIcon, 
  Loader2 as LoaderIcon, 
  CheckCircle2 as CheckIcon 
} from "lucide-react";
import { getMessages, sendMessage } from "../api/chat";
import { AuthContext } from "../contexts/AuthContext";

const ChatPage = () => {
  // 1. Pull data directly from AuthContext
  const { user, role, employerId, loading: authLoading } = useContext(AuthContext); 
  const { receiverId: routeReceiverId } = useParams();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const queryName = searchParams.get("name");

  // 2. Identify the Sender (Crucial Fix for Employer Role)
  const receiverId = (routeReceiverId && routeReceiverId !== "messages") ? routeReceiverId.trim() : null;
  const senderId = role === "employer" ? employerId : (user?._id || user?.id);

  const [displayName, setDisplayName] = useState(queryName || "Conversation");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync the display name from navigation or query params
  useEffect(() => {
    if (queryName) {
      setDisplayName(queryName);
    } else if (location.state?.receiverName) {
      setDisplayName(location.state.receiverName);
    }
  }, [queryName, location.state]);

  // Fetch Chat History
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!receiverId || !senderId) return;

    try {
      if (showLoading) setLoading(true);
      const data = await getMessages(senderId, receiverId);
      setMessages(data || []);
    } catch (err) {
      console.error("Chat history fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [receiverId, senderId]);

  // Poll for messages
  useEffect(() => {
    if (!receiverId || !senderId) return;
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [fetchMessages, receiverId, senderId]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTextareaChange = (e) => {
    setNewMsg(e.target.value);
    e.target.style.height = 'inherit';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    
    // Validates all required fields before attempting execution
    if (!newMsg.trim() || !receiverId || !senderId || !role) {
      console.error("❌ Send Blocked - Missing:", { 
        msg: !!newMsg.trim(), 
        receiver: !!receiverId, 
        sender: !!senderId, 
        role: !!role 
      });
      return;
    }

    const messageText = newMsg.trim();
    setNewMsg(""); 
    setIsSending(true);

    const isEmployer = role.toLowerCase() === "employer";
    const senderModel = isEmployer ? "Employer" : "Jobseeker";
    const receiverModel = isEmployer ? "Jobseeker" : "Employer";

    const payload = {
      senderId,
      senderModel,
      senderName: user?.name || "User",
      senderAvatar: user?.profilePicture || user?.avatar || null,
      receiverId,
      receiverModel,
      receiverName: displayName,
      message: messageText,
    };

    try {
      const msgData = await sendMessage(payload);
      setMessages((prev) => [...prev, msgData]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
      }
    } catch (err) {
      console.error("❌ Send Failed:", err.response?.data || err);
      setNewMsg(messageText); 
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // 🛡️ Auth Guard
  if (authLoading || (!user && !senderId)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <LoaderIcon className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Verifying Session...</p>
      </div>
    );
  }

  // Empty State
  if (!receiverId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white p-10">
        <div className="bg-blue-50/50 p-12 rounded-[4rem] mb-8 border border-blue-50">
          <MsgIcon size={80} className="text-blue-600/30" strokeWidth={1.2} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Messages</h3>
        <p className="text-slate-500 mt-3 font-medium text-center">Select a conversation to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
            {displayName?.charAt(0)}
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-xl tracking-tight">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/30">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <LoaderIcon className="animate-spin text-blue-600" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <MsgIcon className="text-blue-600 mb-4" size={24} />
            <p className="font-bold text-slate-900">No history found</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = String(msg.senderId) === String(senderId);
            return (
              <div key={msg._id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%]">
                  <div className={`px-6 py-4 rounded-[2rem] text-[15px] font-semibold shadow-sm transition-all ${
                    isMe 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                  }`}>
                    {msg.message}
                  </div>
                  <div className={`flex items-center gap-2 mt-2 px-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </p>
                    {isMe && <CheckIcon size={12} className="text-blue-500 opacity-60" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-50">
        <div className="flex items-end gap-3 bg-slate-100/50 p-3 rounded-[2.5rem] border border-slate-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={newMsg}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            rows={1}
            placeholder={`Reply to ${displayName}...`}
            className="flex-1 bg-transparent resize-none p-3 text-[15px] font-bold text-slate-900 focus:outline-none min-h-[48px]"
          />
          <button
            type="submit"
            disabled={!newMsg.trim() || isSending}
            className="w-12 h-12 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:opacity-20 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-100"
          >
            {isSending ? <LoaderIcon className="animate-spin" size={18} /> : <SendIcon size={18} strokeWidth={3} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;