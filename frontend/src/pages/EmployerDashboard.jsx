import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  MessageSquare, PlusCircle, Briefcase, Users, Calendar,
  UserCircle, LogOut, LayoutDashboard, ChevronRight, Bell, CheckCircle, TrendingUp
} from "lucide-react";

import ChatPage from "./ChatPage";
import PostJob from "./PostJob";
import Interviews from "./Interviews";
import Jobs from "./Jobs";
import EmployerApplications from "./EmployerApplications";
import EmployerReports from "./EmployerReports"; // ✅ Import the new Reports component
import { AuthContext } from "../contexts/AuthContext";
import apiClient from "../api/client"; 

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setAuthUser } = useContext(AuthContext);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Helper flags
  const isApplicationsPage = location.pathname.includes("applications");
  const isChatActive = location.pathname.includes("chat") || location.pathname.includes("messages");

  // Sync unread count whenever the user object changes
  useEffect(() => {
    if (user?.notifications) {
      const unread = user.notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  }, [user]);

  // Sidebar Items
  const navItems = [
    { to: "reports", label: "Analytics", icon: <TrendingUp size={18} /> }, // ✅ Added Reports Link
    { to: "interviews", label: "Interviews", icon: <Calendar size={18} /> },
    { to: "chat", label: "Messages", icon: <MessageSquare size={18} /> },
    { to: "post-job", label: "Post a Job", icon: <PlusCircle size={18} /> },
    { to: "my-jobs", label: "My Jobs", icon: <Briefcase size={18} /> },
    { to: "applications", label: "Applications", icon: <Users size={18} /> },
  ];

  const handleMarkAsRead = async () => {
    try {
      await apiClient.put("/employers/notifications/read"); 
      const updatedUser = {
        ...user,
        notifications: user.notifications.map(n => ({ ...n, read: true }))
      };
      setAuthUser(updatedUser);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications");
    }
  };

  const getPageTitle = () => {
    if (isChatActive) return "Messages";
    const path = location.pathname.split("/").filter(Boolean).pop();
    const item = navItems.find(i => i.to === path);
    return item ? item.label : "Dashboard Overview";
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* --- 1. SIDEBAR --- */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-30 shrink-0">
        <div className="p-6 mb-2">
          <div 
            className="flex items-center gap-3 px-2 cursor-pointer group" 
            onClick={() => navigate("/employer/dashboard")}
          >
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
              <LayoutDashboard size={22} />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-slate-800">HireFlow</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
            Recruitment
          </p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => {
                const actuallyActive = isActive || (item.to === 'chat' && isChatActive);
                return `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  actuallyActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`;
              }}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm uppercase">
              {user?.companyName?.charAt(0) || "E"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.companyName || "Employer"}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified Employer</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("profile")} className="flex-1 flex items-center justify-center py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all">
              <UserCircle size={16} />
            </button>
            <button onClick={logout} className="flex-1 flex items-center justify-center py-2 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* --- 2. MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className={`h-20 flex items-center justify-between px-10 shrink-0 z-20 transition-colors duration-300 ${
          isApplicationsPage ? "bg-slate-900 text-white border-b border-slate-800" : "bg-white/80 backdrop-blur-md border-b border-slate-200"
        }`}>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{getPageTitle()}</h1>
              <p className={`text-xs font-medium mt-0.5 ${isApplicationsPage ? "text-slate-400" : "text-slate-500"}`}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {user?.lastReportReceived && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                <CheckCircle size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Reports Synced</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full transition-colors relative ${
                isApplicationsPage ? "hover:bg-slate-800" : "hover:bg-slate-100 text-slate-400"
              }`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                  <button onClick={handleMarkAsRead} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Clear All</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {user?.notifications?.length > 0 ? (
                    user.notifications.slice().reverse().map((notif, idx) => (
                      <div key={idx} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                        <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">No notifications yet.</div>
                  )}
                </div>
              </div>
            )}

            <div className={`h-6 w-[1px] ${isApplicationsPage ? "bg-slate-700" : "bg-slate-200"}`}></div>
            <button 
              onClick={() => navigate("post-job")} 
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              Post New Job
            </button>
          </div>
        </header>

        <div 
          onClick={() => setShowNotifications(false)}
          className={`flex-1 overflow-y-auto transition-colors duration-300 ${
            isApplicationsPage ? "bg-slate-900" : "bg-slate-50"
          }`}
        >
          <Routes>
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:receiverId" element={<ChatPage />} />
            <Route path="applications" element={<EmployerApplications />} />
            
            {/* ✅ NEW: Reports Route Added Here */}
            <Route path="reports" element={<EmployerReports />} />

            <Route
              path="*"
              element={
                <div className="p-8 max-w-7xl mx-auto w-full">
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 min-h-[75vh]">
                    <Routes>
                      <Route path="/" element={<DefaultOverview lastSync={user?.lastReportReceived} />} />
                      <Route path="interviews" element={<Interviews />} />
                      <Route path="post-job" element={<PostJob />} />
                      <Route path="my-jobs" element={<Jobs />} />
                      <Route path="*" element={<DefaultOverview />} />
                    </Routes>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function DefaultOverview({ lastSync }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-blue-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 text-blue-600 shadow-inner">
        <LayoutDashboard size={40} />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Employer Dashboard</h2>
      <p className="text-slate-500 mt-3 max-w-sm leading-relaxed font-medium">
        Review your latest applications, schedule interviews, and manage your job postings from one central hub.
      </p>
      
      {/* ✅ Direct link to Reports in the empty state */}
      <button 
        onClick={() => navigate("reports")}
        className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
      >
        <TrendingUp size={16} />
        View Real-time Analytics
      </button>

      {lastSync && (
        <p className="mt-4 text-[10px] font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full uppercase tracking-widest border border-green-100">
          Last Report Received: {new Date(lastSync).toLocaleString()}
        </p>
      )}
    </div>
  );
}