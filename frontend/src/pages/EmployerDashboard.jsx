import React, { useContext, useEffect, useState, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  MessageSquare,
  PlusCircle,
  Briefcase,
  Users,
  Calendar,
  UserCircle,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  Bell,
  TrendingUp,
  Sparkles,
  Search
} from "lucide-react";

import ChatPage from "./ChatPage";
import PostJob from "./PostJob";
import Interviews from "./Interviews";
import Jobs from "./Jobs";
import EmployerApplications from "./EmployerApplications";
import EmployerReports from "./EmployerReports";
import EmployerNotifications from "./EmployerNotifications";
import { AuthContext } from "../contexts/AuthContext";
import apiClient from "../api/client";
import { socket } from "../socket";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isChatActive = location.pathname.includes("/chat") || location.pathname.includes("/messages");

  // ===============================
  // FETCH NOTIFICATIONS
  // ===============================
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await apiClient.get(`/notifications/user/${user._id}`);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching dashboard notifications", err);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ===============================
  // REAL-TIME NOTIFICATIONS
  // ===============================
  const handleNewNotification = useCallback((newNotif) => {
    setNotifications((prev) => {
      if (prev.find((n) => n._id === newNotif._id)) return prev;
      return [newNotif, ...prev];
    });
  }, []);

  useEffect(() => {
    if (!socket || !user?._id) return;
    const onConnect = () => socket.emit("join", user._id);
    if (socket.connected) onConnect();

    socket.on("connect", onConnect);
    socket.on("new_notification", handleNewNotification);
    socket.on("reconnect", onConnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("new_notification", handleNewNotification);
      socket.off("reconnect", onConnect);
    };
  }, [user?._id, handleNewNotification]);

  useEffect(() => {
    const count = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  const navItems = [
    { to: "reports", label: "Analytics", icon: <TrendingUp size={18} /> },
    { to: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { to: "interviews", label: "Interviews", icon: <Calendar size={18} /> },
    { to: "chat", label: "Messages", icon: <MessageSquare size={18} /> },
    { to: "post-job", label: "Post a Job", icon: <PlusCircle size={18} /> },
    { to: "my-jobs", label: "My Jobs", icon: <Briefcase size={18} /> },
    { to: "applications", label: "Applications", icon: <Users size={18} /> },
  ];

  const getPageTitle = () => {
    if (isChatActive) return "Messages";
    const segments = location.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const item = navItems.find((i) => i.to === lastSegment);
    return item ? item.label : "Dashboard Overview";
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 bg-[#0F172A] flex flex-col shadow-2xl shrink-0 z-20">
        <div className="p-8">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/employer/dashboard")}
          >
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-900/50 group-hover:scale-110 transition-all duration-300">
              <Sparkles size={22} fill="currentColor" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              HireFlow<span className="text-blue-500">.</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4 opacity-70">Management</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive || (item.to === "chat" && isChatActive)
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-900/20 active-nav-glow"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                <span className="font-bold text-[13px] tracking-wide">
                  {item.label}
                </span>
              </div>

              {unreadCount > 0 && item.to === "notifications" && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-[#0F172A]">
                  {unreadCount}
                </span>
              )}
              <ChevronRight size={14} className={`opacity-20 group-hover:opacity-100 transition-opacity ${item.to === "chat" && isChatActive ? "hidden" : ""}`} />
            </NavLink>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="m-4 p-5 rounded-[2rem] bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
              {user?.companyName?.charAt(0) || user?.name?.charAt(0) || "E"}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Employer</span>
              <span className="text-xs font-bold text-white truncate">
                {user?.companyName || user?.name || "Account"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("profile")}
              className="flex-1 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-all flex justify-center border border-slate-600/30"
              title="Settings"
            >
              <UserCircle size={18} />
            </button>

            <button
              onClick={logout}
              className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex justify-center border border-rose-500/20"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-12 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl z-10">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Workspace</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative hidden lg:block">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="pl-11 pr-6 py-2.5 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
              />
            </div>
            <div className="flex flex-col items-end">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-sm font-bold text-slate-900">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/50 p-8">
          <Routes>
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:receiverId" element={<ChatPage />} />
            <Route path="notifications" element={<EmployerNotifications />} />
            <Route path="applications" element={<EmployerApplications />} />
            <Route path="reports" element={<EmployerReports />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="my-jobs" element={<Jobs />} />
            <Route path="/" element={<DefaultOverview />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function DefaultOverview() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="relative overflow-hidden bg-[#0F172A] rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-900/20">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={12} /> Live Platform Status: Active
            </div>
            <h2 className="text-5xl font-black tracking-tight leading-[1.1] mb-6">
              Empower your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Hiring Pipeline.</span>
            </h2>
            <p className="text-slate-400 font-medium text-lg max-w-md leading-relaxed mb-10">
              Welcome back to your command center. Manage applications, schedule interviews, and chat with talent seamlessly.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button
                onClick={() => navigate("post-job")}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-95"
              >
                Post New Opening
              </button>
              <button
                onClick={() => navigate("reports")}
                className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700 active:scale-95"
              >
                View Insights
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 hidden lg:block">
            <div className="w-72 h-72 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3.5rem] rotate-12 flex items-center justify-center shadow-2xl shadow-blue-900/40 border-4 border-white/10">
              <LayoutDashboard size={100} className="text-white -rotate-12" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {[
          { label: "Talent Pool", val: "Applications", link: "applications", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Calendar", val: "Interviews", link: "interviews", color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active", val: "My Jobs", link: "my-jobs", color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.link)}
            className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black text-slate-900`}>{item.val}</h3>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <ChevronRight size={20} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}