import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { getUserChats, getChatHistory, sendMessage } from '../api/chat';
import { Send, MessageSquare, Circle, Loader2, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Messages = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollRef = useRef();

  // Robust ID detection across roles
  const currentUserId = user?.employerId || user?.jobseekerId || user?.userId || user?._id || user?.id;

  // --- 1. INITIALIZATION & INBOX SYNC ---
  useEffect(() => {
    const initInbox = async () => {
      if (!currentUserId) return;
      try {
        const data = await getUserChats(currentUserId);
        
        const params = new URLSearchParams(location.search);
        const targetId = params.get('target');
        const targetName = params.get('name');

        if (targetId) {
          const existing = data.find(c => 
            (c.otherUser?._id === targetId || c.receiverId === targetId || c.senderId === targetId)
          );

          if (existing) {
            setActiveChat({ ...existing, _id: targetId });
          } else if (targetName) {
            const temp = { _id: targetId, name: targetName, isNew: true, lastMessage: "New Conversation" };
            setConversations(prev => [temp, ...prev]);
            setActiveChat(temp);
          }
          // Clean URL after reading params
          navigate(location.pathname, { replace: true });
        } else {
          setConversations(data);
          // Auto-select first chat if none active
          if (data.length > 0 && !activeChat) {
            const first = data[0];
            setActiveChat({ ...first, _id: first.otherUser?._id || first._id });
          }
        }
      } catch (err) {
        console.error("❌ Inbox Error:", err);
      }
    };
    initInbox();
  }, [currentUserId]);

  // --- 2. SOCKET: REAL-TIME UPDATES ---
  useEffect(() => {
    if (socket && currentUserId) {
      // Ensure user is in their private room
      socket.emit("join", currentUserId);

      const handleReceive = (msg) => {
        const recipientId = activeChat?.otherUser?._id || activeChat?._id;
        
        // Update message list if it belongs to current active view
        if (msg.senderId === recipientId || (msg.senderId === currentUserId && msg.receiverId === recipientId)) {
          setMessages(prev => [...prev, msg]);
        }

        // Refresh sidebar to show latest message/order
        refreshSidebar();
      };

      socket.on("receive_message", handleReceive);
      return () => socket.off("receive_message", handleReceive);
    }
  }, [socket, activeChat?._id, currentUserId]);

  const refreshSidebar = async () => {
    const data = await getUserChats(currentUserId);
    setConversations(data);
  };

  // --- 3. LOAD CHAT HISTORY ---
  useEffect(() => {
    const recipientId = activeChat?.otherUser?._id || activeChat?._id;
    if (recipientId && !activeChat.isNew && currentUserId) {
      const loadMessages = async () => {
        setLoadingHistory(true);
        try {
          const data = await getChatHistory(currentUserId, recipientId);
          setMessages(data);
        } catch (err) {
          console.error("❌ History Error:", err);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [activeChat?._id, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 4. SEND MESSAGE LOGIC ---
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const recipientId = activeChat?.otherUser?._id || activeChat?._id;
    const senderType = user?.employerId ? "Employer" : "JobSeeker";

    if (sending || !newMessage.trim() || !recipientId || !currentUserId) return;

    const messageData = {
      receiverId: recipientId,
      senderId: currentUserId,
      message: newMessage.trim(),
      senderType: senderType 
    };

    try {
      setSending(true);
      // 1. Save to Database via API
      const savedMsg = await sendMessage(messageData);
      
      // 2. Emit via Socket for real-time delivery
      if (socket) socket.emit("send_message", messageData);

      // 3. UI Update (The socket listener will also handle this, but we update locally for speed)
      setNewMessage('');
      
      // If it was a new chat, convert it to a regular chat
      if (activeChat.isNew) {
        setActiveChat(prev => ({ ...prev, isNew: false }));
        refreshSidebar();
      }
    } catch (err) {
      console.error("❌ Send failed:", err);
    } finally {
      setSending(false);
    }
  };

  // --- UI HELPERS ---
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const filteredConversations = conversations.filter(c => 
    (c.otherUser?.name || c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[88vh] w-full bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
      
      {/* --- SIDEBAR: CONVERSATION LIST --- */}
      <div className="w-1/3 border-r border-slate-100 bg-slate-50/30 flex flex-col">
        <div className="p-8 bg-white border-b border-slate-100">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Messages</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {filteredConversations.length > 0 ? filteredConversations.map((conv) => {
            const name = conv.otherUser?.name || conv.name || "User";
            const id = conv.otherUser?._id || conv._id;
            const isActive = activeChat?._id === id;
            return (
              <div
                key={id}
                onClick={() => setActiveChat({ ...conv, _id: id })}
                className={`group px-6 py-4 mx-4 rounded-[1.5rem] flex items-center gap-4 cursor-pointer transition-all ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-white text-slate-600'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${isActive ? 'bg-white text-blue-600' : 'bg-slate-900 text-white'}`}>
                  {name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`font-black text-sm truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{name}</p>
                    <span className={`text-[9px] font-bold uppercase opacity-60 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate font-medium opacity-80 ${isActive ? 'text-blue-50' : 'text-slate-400'}`}>
                    {conv.lastMessage || "No messages yet"}
                  </p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-20 opacity-30 px-10">
              <MessageSquare size={40} className="mx-auto mb-4" />
              <p className="font-bold text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN CHAT WINDOW --- */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xl border border-slate-200">
                  {(activeChat.otherUser?.name?.[0] || activeChat.name?.[0] || '?')}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-none">{activeChat.otherUser?.name || activeChat.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Live Connection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Retrieving Encrypted History</span>
                </div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[65%] px-6 py-4 rounded-[2rem] text-[14px] leading-relaxed font-medium shadow-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-2 px-3 font-bold uppercase tracking-wider">
                      {msg.createdAt ? formatTime(msg.createdAt) : 'Sending...'}
                    </span>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input Footer */}
            <div className="p-8 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-100 rounded-[1.5rem] px-8 py-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium border-transparent focus:border-blue-500 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-slate-900 text-white p-5 rounded-[1.5rem] hover:bg-blue-600 disabled:opacity-20 shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  {sending ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-6">
               <MessageSquare size={48} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Secure Messenger</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Select a contact to begin your conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;