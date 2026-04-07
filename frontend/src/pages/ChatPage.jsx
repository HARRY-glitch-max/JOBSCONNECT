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
import { useSocket } from "../hooks/useSocket";

const ChatPage = () => {
  const { user, role, employerId, loading: authLoading } = useContext(AuthContext); 
  const socket = useSocket();
  const params = useParams();
  const location = useLocation();
  
  // 1. IDENTITY RESOLUTION (Stable IDs)
  const routeId = params.id || params.receiverId || params.chatId;
  const receiverId = (routeId && routeId !== "messages") 
    ? routeId.trim() 
    : (location.state?.receiverId || null);
  
  const senderId = role === "employer" 
    ? (employerId || user?.employerId || user?._id || user?.id) 
    : (user?._id || user?.id);

  const [displayName, setDisplayName] = useState("Conversation");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // --- 2. INSTANT SOCKET LOGIC ---
  useEffect(() => {
    if (!socket || !senderId) return;

    // Tell the server to put this connection into the User's private room
    socket.emit("join", String(senderId));

    // Listen for the "receive_message" event (matches backend savedMsg emission)
    const handleIncoming = (msg) => {
      const msgSender = String(msg.senderId);
      const msgReceiver = String(msg.receiverId);
      const currentReceiver = String(receiverId);
      const currentSender = String(senderId);

      // Only update state if message belongs to THIS active conversation
      const isRelevant = 
        (msgSender === currentReceiver && msgReceiver === currentSender) || 
        (msgSender === currentSender && msgReceiver === currentReceiver);

      if (isRelevant) {
        setMessages((prev) => {
          const exists = prev.find(m => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("receive_message", handleIncoming);
    return () => socket.off("receive_message", handleIncoming);
  }, [socket, senderId, receiverId]);

  // --- 3. DATA FETCHING ---
  const fetchMessages = useCallback(async () => {
    if (!receiverId || !senderId) return;
    try {
      const data = await getMessages(senderId, receiverId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Fetch Error:", err.message);
    }
  }, [receiverId, senderId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll Management
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- 4. MESSAGE SENDING (Optimistic UX) ---
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMsg.trim() || !receiverId || !senderId || isSending) return;

    const messageText = newMsg.trim();
    setNewMsg(""); 
    setIsSending(true);

    const payload = {
      senderId,
      senderType: role === "employer" ? "Employer" : "JobSeeker", // Matched to backend expectations
      message: messageText,
      receiverId,
      senderName: user?.companyName || user?.name || "User",
    };

    try {
      // We rely on the Socket loopback for the UI update, 
      // but you can also add the response here if your socket doesn't loop back to sender.
      const msgData = await sendMessage(payload);
      
      // Manually add if socket hasn't reflected it yet (prevents double entry via the find check)
      setMessages((prev) => {
        const exists = prev.find(m => m._id === msgData._id);
        return exists ? prev : [...prev, msgData];
      });

      if (textareaRef.current) textareaRef.current.style.height = 'inherit';
    } catch (err) {
      setNewMsg(messageText); // Restore text on failure
      console.error(`❌ Send Failed:`, err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleTextChange = (e) => {
    setNewMsg(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  if (authLoading) return <div className="flex items-center justify-center h-full"><LoaderIcon className="animate-spin text-blue-600" /></div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden shadow-2xl rounded-l-[2.5rem] border-l border-slate-100">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg">
            {displayName?.charAt(0)}
          </div>
          <div>
            <h2 className="font-black text-slate-900 tracking-tight">{displayName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-4 bg-slate-50/30 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = String(msg.senderId) === String(senderId);
          return (
            <div key={msg._id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div className={`px-5 py-3 rounded-[1.5rem] text-[14px] font-medium shadow-sm ${
                  isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                }`}>
                  {msg.message}
                </div>
                <div className={`flex items-center gap-1 mt-1.5 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                  <p className="text-[9px] text-slate-400 font-bold opacity-60">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </p>
                  {isMe && <CheckIcon size={10} className="text-blue-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
        <div className="flex items-end gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            ref={textareaRef}
            value={newMsg}
            onChange={handleTextChange}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Write a message..."
            className="flex-1 bg-transparent resize-none p-3 text-sm font-semibold focus:outline-none max-h-32"
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMsg.trim() || isSending}
            className="w-10 h-10 bg-blue-600 rounded-xl text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-200"
          >
            {isSending ? <LoaderIcon className="animate-spin" size={16} /> : <SendIcon size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage; 