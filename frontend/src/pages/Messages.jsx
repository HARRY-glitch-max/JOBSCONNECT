import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { getUserChats, getChatHistory, sendMessage } from '../api/chat';
import { Send, MessageSquare, Circle, Loader2 } from 'lucide-react';
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

  const scrollRef = useRef();

  const currentUserId = user?.employerId || user?.jobseekerId || user?.userId || user?._id || user?.id;

  // ✅ 1. Load Inbox & Handle Deep Linking
  useEffect(() => {
    const initInbox = async () => {
      try {
        if (!currentUserId) return;
        const data = await getUserChats(currentUserId);
        
        const params = new URLSearchParams(location.search);
        const targetId = params.get('target');
        const targetName = params.get('name');

        if (targetId) {
          const existing = data.find(c => 
            (c.otherUser?._id === targetId || c.receiverId === targetId || c.senderId === targetId || c._id === targetId)
          );

          if (existing) {
            setActiveChat({ ...existing, _id: targetId });
            setConversations(data);
          } else if (targetName) {
            const newTempChat = { _id: targetId, name: targetName, isNew: true, lastMessage: "Start a new chat" };
            setConversations([newTempChat, ...data]);
            setActiveChat(newTempChat);
          }
          navigate(location.pathname, { replace: true });
        } else {
          setConversations(data);
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

  // ✅ 2. Load History
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

  // ✅ 3. Socket Event Listener
  useEffect(() => {
    if (socket && activeChat) {
      const recipientId = activeChat.otherUser?._id || activeChat._id;
      const handleReceive = (msg) => {
        if (msg.senderId === recipientId || msg.receiverId === recipientId) {
          setMessages(prev => [...prev, msg]);
        }
      };
      socket.on("receive_message", handleReceive);
      return () => socket.off("receive_message", handleReceive);
    }
  }, [socket, activeChat?._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ 4. Send Message Logic
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const recipientId = activeChat?.otherUser?._id || activeChat?._id;
    const isEmployer = user?.role === 'employer' || (!!user?.employerId && user?.role !== 'jobseeker');
    const senderType = isEmployer ? "Employer" : "Jobseeker";

    if (sending || !newMessage.trim() || !recipientId || !currentUserId) return;

    const messageData = {
      receiverId: recipientId,
      senderId: currentUserId,
      message: newMessage.trim(),
      senderType: senderType 
    };

    try {
      setSending(true);
      const savedMsg = await sendMessage(messageData);
      setMessages(prev => [...prev, savedMsg]);
      setNewMessage('');
      if (socket) socket.emit("send_message", savedMsg);

      if (activeChat.isNew) {
        const updated = await getUserChats(currentUserId);
        setConversations(updated);
        setActiveChat(prev => ({ ...prev, isNew: false }));
      }
    } catch (err) {
      console.error("❌ Send failed:", err.response?.data?.message || err.message);
    } finally {
      setSending(false);
    }
  };

  // 🛠️ Date Formatting Helpers
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[85vh] w-full bg-white border rounded-3xl overflow-hidden shadow-2xl">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-slate-50/50 flex flex-col">
        <div className="p-6 bg-white border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-slate-800">Inbox</h2>
            <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold uppercase">
              {conversations.length} Chats
            </span>
          </div>
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="w-full bg-slate-100 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const cName = conv.otherUser?.name || conv.name || "User";
            const cId = conv.otherUser?._id || conv._id;
            const isActive = activeChat?._id === cId;
            return (
              <div
                key={cId}
                onClick={() => setActiveChat({ ...conv, _id: cId })}
                className={`p-4 mx-2 my-1 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-white text-slate-600'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-slate-800 text-white'}`}>
                  {cName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{cName}</p>
                  <p className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{conv.lastMessage || "No messages"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat View */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-5 border-b flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                {(activeChat.otherUser?.name?.[0] || activeChat.name?.[0] || 'A').toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 leading-none mb-1">{activeChat.otherUser?.name || activeChat.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Circle size={8} className="fill-green-500 text-green-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Now</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader2 className="animate-spin mb-2" />
                  <span>Syncing history...</span>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId;
                  const showDate = idx === 0 || new Date(messages[idx-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                  return (
                    <React.Fragment key={msg._id || idx}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                            {formatDateLabel(msg.createdAt || new Date())}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[70%] p-3 px-5 rounded-3xl text-sm shadow-sm ${
                          isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none'
                        }`}>
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-2 font-medium">
                          {formatTime(msg.createdAt || new Date())}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            <div className="p-6 bg-white border-t">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeChat.otherUser?.name || activeChat.name}...`}
                  className="flex-1 bg-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 disabled:opacity-30 shadow-lg active:scale-90 transition-transform"
                >
                  {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <MessageSquare size={80} className="opacity-10 mb-6" />
            <h3 className="text-2xl font-black text-slate-400">Messenger</h3>
            <p className="text-sm font-medium opacity-60">Select a contact to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;