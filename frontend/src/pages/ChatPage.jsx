import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { 
  Send as SendIcon, 
  MessageSquare as MsgIcon, 
  Loader2 as LoaderIcon, 
  CheckCircle2 as CheckIcon,
  AlertCircle
} from "lucide-react";
import { getMessages, sendMessage } from "../api/chat";
import { AuthContext } from "../contexts/AuthContext";

const ChatPage = () => {
  // 1. EXTRACT CONTEXT
  const { user, role, employerId, loading: authLoading } = useContext(AuthContext); 
  const params = useParams();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const queryName = searchParams.get("name");

  // 2. STRENGTHENED IDENTIFICATION LOGIC
  // Support both 'receiverId' and 'chatId' depending on the route definition
  const routeId = params.receiverId || params.chatId || params.id;
  const receiverId = (routeId && routeId !== "messages") ? routeId.trim() : null;
  
  // Resolve Sender ID based on role
  const senderId = role === "employer" 
    ? (employerId || user?.employerId || user?._id || user?.id) 
    : (user?._id || user?.id);

  const [displayName, setDisplayName] = useState(queryName || "Conversation");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // --- NEW: TEXTAREA HANDLER (Fixed ReferenceError) ---
  const handleTextareaChange = (e) => {
    setNewMsg(e.target.value);
    
    // Auto-resize textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  };

  // --- DEBUG LOGGING ---
  useEffect(() => {
    if (!authLoading) {
      console.log("🛠️ Chat Debugger:", {
        role,
        senderId,
        receiverId,
        authReady: !authLoading
      });
    }
  }, [role, senderId, receiverId, authLoading]);

  // Update name from state or query
  useEffect(() => {
    if (queryName) {
      setDisplayName(queryName);
    } else if (location.state?.receiverName) {
      setDisplayName(location.state.receiverName);
    }
  }, [queryName, location.state]);

  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!receiverId || !senderId) return;
    
    try {
      if (showLoading) setLoading(true);
      const data = await getMessages(senderId, receiverId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ API Error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [receiverId, senderId]);

  // Polling Logic (Fallback for WebSocket issues)
  useEffect(() => {
    if (!receiverId || !senderId) return;

    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [fetchMessages, receiverId, senderId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMsg.trim() || !receiverId || !senderId || isSending) return;

    const messageText = newMsg.trim();
    setNewMsg(""); 
    setIsSending(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'inherit';

    const senderType = role?.toLowerCase() === "employer" ? "Employer" : "Jobseeker";

    const payload = {
      senderId,
      senderType, 
      message: messageText,
      receiverId,
      senderName: user?.companyName || user?.name || "User",
      senderAvatar: user?.avatar || user?.profilePicture || null,
    };

    try {
      const msgData = await sendMessage(payload);
      setMessages((prev) => [...prev, msgData]);
    } catch (err) {
      setNewMsg(messageText); // Restore text on failure
      console.error(`❌ Send Failed:`, err.message);
    } finally {
      setIsSending(false);
    }
  };

  // --- RENDER LOGIC ---

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
        <LoaderIcon className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verifying Session...</p>
      </div>
    );
  }

  if (!senderId && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10 text-center">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <h3 className="text-xl font-black text-slate-900">Authentication Error</h3>
        <p className="mt-2 text-sm">We couldn't resolve your User ID. Please log in again.</p>
      </div>
    );
  }

  if (!receiverId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white p-10">
        <div className="bg-blue-50/50 p-12 rounded-[4rem] mb-8 border border-blue-50">
          <MsgIcon size={80} className="text-blue-600/30" strokeWidth={1.2} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Select a Chat</h3>
        <p className="text-slate-500 mt-3 font-medium text-center max-w-xs">
          Open a conversation from your dashboard to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden shadow-2xl rounded-l-[2.5rem] border-l border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-200">
            {displayName?.charAt(0)}
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-xl tracking-tight">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/40">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <LoaderIcon className="animate-spin text-blue-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Messages</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <MsgIcon className="text-blue-600/40 mb-4" size={40} />
            <p className="font-bold text-slate-900 text-lg">New Connection</p>
            <p className="text-sm text-slate-500">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = String(msg.senderId) === String(senderId);
            return (
              <div key={msg._id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%]">
                  <div className={`px-6 py-4 rounded-[2rem] text-[15px] font-semibold shadow-sm transition-all duration-300 ${
                    isMe 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-blue-100" 
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-slate-100"
                  }`}>
                    {msg.message}
                  </div>
                  <div className={`flex items-center gap-2 mt-2 px-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-60">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."}
                    </p>
                    {isMe && <CheckIcon size={12} className="text-blue-500" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
        <div className="flex items-end gap-3 bg-slate-100/50 p-3 rounded-[2.5rem] border border-slate-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={newMsg}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={`Type your message...`}
            className="flex-1 bg-transparent resize-none p-3 text-[15px] font-bold text-slate-900 focus:outline-none min-h-[48px] max-h-[150px]"
          />
          <button
            type="submit"
            disabled={!newMsg.trim() || isSending}
            className="w-12 h-12 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:opacity-20 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-200 flex-shrink-0"
          >
            {isSending ? <LoaderIcon className="animate-spin" size={18} /> : <SendIcon size={18} strokeWidth={3} />}
          </button>
        </div>
        <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-4">
          Press Enter to send · Shift + Enter for new line
        </p>
      </form>
    </div>
  );
};

export default ChatPage;