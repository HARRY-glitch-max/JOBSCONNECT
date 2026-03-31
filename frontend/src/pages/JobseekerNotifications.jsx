import React, { useState, useEffect, useContext, useCallback } from "react";
// ✅ 1. Use your central apiClient instead of raw axios
import apiClient from "../api/client"; 
import { AuthContext } from "../contexts/AuthContext";
import { Bell, CheckCheck, Calendar, Info, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import { Link } from "react-router-dom";

const JobseekerNotifications = ({ refreshBadge }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 2. fetchNotifications simplified to use the interceptor
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setError(null);
      // No need for manual headers or timestamp hacks; apiClient handles it
      const { data } = await apiClient.get(`/notifications/user/${user._id}`);
      
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Error:", err.response || err);
      // Only show error UI if it's not a 401 (interceptor handles logouts)
      if (err.response?.status !== 401) {
        setError("Failed to sync notifications. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      // ✅ Use apiClient
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (refreshBadge) refreshBadge();
    } catch (err) {
      console.error("Mark Read Error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      // ✅ Use apiClient
      await apiClient.put(`/notifications/user/${user._id}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (refreshBadge) refreshBadge();
    } catch (err) {
      console.error("Mark All Read Error:", err);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "Just now";
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-slate-500">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="font-medium animate-pulse">Syncing your alerts...</p>
      </div>
    );
  }

  return (
    <div className="p-2 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Bell className="text-blue-600" size={32} /> Notifications
          </h1>
          <p className="text-slate-500 mt-1">Stay updated on your job applications and interviews.</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllRead}
            className="group text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <CheckCheck size={18} className="group-hover:scale-110 transition-transform" /> 
            Mark all as read
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-medium">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 p-16 rounded-3xl text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No notifications yet</h3>
            <p className="text-slate-500 mt-1">When an employer updates your status, it'll appear here.</p>
            <button 
              onClick={fetchNotifications} 
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Check again
            </button>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n._id} 
              className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
                n.isRead 
                ? "bg-white border-slate-100 opacity-80" 
                : "bg-white border-blue-100 shadow-lg shadow-blue-50/50 ring-1 ring-blue-50"
              }`}
            >
              <div className="flex gap-5">
                <div className={`p-3 rounded-2xl h-fit shadow-sm ${
                  n.type === 'interview' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {n.type === 'interview' ? <Calendar size={24} /> : <Bell size={24} />}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-base leading-relaxed ${n.isRead ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>
                      {n.content}
                    </p>
                    {!n.isRead && (
                      <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full mt-2 animate-pulse"></span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-slate-400">
                        {getTimeAgo(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <button 
                          onClick={() => markAsRead(n._id)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>

                    {n.link && (
                      <Link 
                        to={n.link} 
                        className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:gap-2 transition-all"
                      >
                        View Details <span className="text-lg">→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobseekerNotifications;