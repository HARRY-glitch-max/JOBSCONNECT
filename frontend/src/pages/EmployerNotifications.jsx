import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { 
  Bell, Check, Clock, PlusCircle, 
  Calendar, Users, FileText, MessageSquare, Trash2, X 
} from "lucide-react";
import apiClient from "../api/client";

export default function EmployerNotifications() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Optimized fetch with internal debugging
  const fetchNotifications = useCallback(async () => {
    // If user isn't loaded yet, stay in loading state but don't fetch
    if (!user?._id) {
      console.log("Waiting for user data...");
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Fetching alerts for Employer: ${user._id}`);
      
      const res = await apiClient.get(`/notifications/user/${user._id}`);
      
      console.log("Server Response:", res.data);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
      setNotifications([]); 
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    // This ensures that as soon as 'user' exists, we fire the request
    if (user?._id) {
      fetchNotifications();
    }
  }, [user?._id, fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (!user?._id) return;
    try {
      await apiClient.put(`/notifications/user/${user._id}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const getIcon = (type) => {
    const iconClass = "shrink-0";
    switch (type) {
      case 'job_posting': return <PlusCircle size={20} className={`${iconClass} text-emerald-500`} />;
      case 'interview': return <Calendar size={20} className={`${iconClass} text-violet-500`} />;
      case 'application_status': return <Users size={20} className={`${iconClass} text-blue-500`} />;
      case 'report': return <FileText size={20} className={`${iconClass} text-orange-500`} />;
      case 'message': return <MessageSquare size={20} className={`${iconClass} text-sky-500`} />;
      default: return <Bell size={20} className={`${iconClass} text-slate-400`} />;
    }
  };

  // ✅ Ensure we don't show the spinner forever if user data never arrives
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user) setLoading(false);
    }, 5000); // Fail gracefully after 5 seconds
    return () => clearTimeout(timeout);
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold animate-pulse">Checking for updates...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notification Center</h2>
          <p className="text-slate-500 font-medium mt-1">Manage alerts for HireFlow updates and applications.</p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Check size={18} className="text-green-500" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`group flex items-start gap-5 p-6 rounded-[2rem] border transition-all ${
                notif.isRead 
                ? "bg-white/50 border-slate-100 opacity-80" 
                : "bg-white border-blue-100 shadow-md shadow-blue-50/50 ring-1 ring-blue-50"
              }`}
            >
              <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                notif.isRead ? "bg-slate-50" : "bg-blue-600 text-white shadow-lg shadow-blue-200"
              }`}>
                {getIcon(notif.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-[0.15em] ${notif.isRead ? 'text-slate-400' : 'text-blue-600'}`}>
                    {notif.type?.replace('_', ' ') || 'Alert'}
                  </span>
                  <button 
                    onClick={() => handleDelete(notif._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 hover:text-rose-500 rounded-md transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <p className={`text-base leading-relaxed ${notif.isRead ? "text-slate-500" : "text-slate-800 font-semibold"}`}>
                  {notif.content}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                    <Clock size={12} />
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </div>
                  {notif.link && (
                    <button 
                      onClick={() => navigate(notif.link)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      View Update →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-slate-200 rounded-[3rem]">
            <div className="bg-slate-50 p-6 rounded-full mb-6 text-slate-300">
              <Bell size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Your tray is empty</h3>
            <p className="text-slate-500 font-medium">No notifications yet. We'll alert you here.</p>
          </div>
        )}
      </div>
    </div>
  );
}