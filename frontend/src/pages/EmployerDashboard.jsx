import React, { useContext, useEffect, useState, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  PlusCircle,
  Briefcase,
  Users,
  Calendar,
  UserCircle,
  LogOut,
  Bell,
  TrendingUp,
  Sparkles,
  Search,
  Target,
  LayoutDashboard
} from "lucide-react";

import ChatPage from "./ChatPage";
import PostJob from "./PostJob";
import Interviews from "./Interviews";
import Jobs from "./Jobs";
import EmployerApplications from "./EmployerApplications";
import EmployerReports from "./EmployerReports";
import EmployerNotifications from "./EmployerNotifications";
import PageTransition from "../components/PageTransition";
import { AuthContext } from "../contexts/AuthContext";
import apiClient from "../api/client";
import { socket } from "../socket";
import Button from "../components/ui/Button";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isChatActive = location.pathname.includes("/chat") || location.pathname.includes("/messages");

  // --- NOTIFICATIONS & SOCKET LOGIC ---
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
    return () => {
      socket.off("connect", onConnect);
      socket.off("new_notification", handleNewNotification);
    };
  }, [user?._id, handleNewNotification]);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  // --- NAVIGATION CONFIG ---
  const navItems = [
    { to: "reports", label: "Analytics", icon: <TrendingUp size={18} /> },
    { to: "notifications", label: "Notifications", icon: <Bell size={18} />, badge: unreadCount },
    { to: "interviews", label: "Interviews", icon: <Calendar size={18} /> },
    { to: "chat", label: "Messages", icon: <MessageSquare size={18} /> },
    { to: "post-job", label: "Post a Job", icon: <PlusCircle size={18} /> },
    { to: "my-jobs", label: "My Jobs", icon: <Briefcase size={18} /> },
    { to: "applications", label: "Applications", icon: <Users size={18} /> },
  ];

  // Absolute Navigation Helper to prevent /chat/notifications/messages bugs
  const goTo = (path) => navigate(`/employer/dashboard/${path}`);

  const getPageTitle = () => {
    if (isChatActive) return "Messages";
    const current = navItems.find(item => location.pathname.endsWith(item.to));
    return current ? current.label : "Dashboard Overview";
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 bg-[#0F172A] flex flex-col shadow-2xl shrink-0 z-30">
        <div className="p-8">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/employer/dashboard")}>
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-900/50 group-hover:rotate-6 transition-all duration-300">
              <Target size={22} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              HireFlow<span className="text-blue-500">.</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 opacity-70">Main Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/employer/dashboard/${item.to}`} // Absolute Pathing
              className={({ isActive }) =>
                `flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive || (item.to === "chat" && isChatActive)
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-[#0F172A]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="m-4 p-5 rounded-[2.5rem] bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
              {user?.companyName?.charAt(0) || "E"}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Employer</span>
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {user?.companyName || user?.name}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => goTo("profile")} className="flex-1 py-2.5 rounded-xl bg-slate-700/40 hover:bg-slate-700 text-slate-300 transition-all flex justify-center border border-slate-600/30">
              <UserCircle size={18} />
            </button>
            <button onClick={logout} className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex justify-center border border-rose-500/20">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 flex items-center justify-between px-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{getPageTitle()}</h1>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden xl:block">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search applications..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 w-56 transition-all" />
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative bg-[#F8FAFC]">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="chat" element={<PageTransition><ChatPage /></PageTransition>} />
              <Route path="chat/:receiverId" element={<PageTransition><ChatPage /></PageTransition>} />
              <Route path="notifications" element={<PageTransition><EmployerNotifications refreshBadge={fetchNotifications} /></PageTransition>} />
              <Route path="applications" element={<PageTransition><EmployerApplications /></PageTransition>} />
              <Route path="reports" element={<PageTransition><EmployerReports /></PageTransition>} />
              <Route path="interviews" element={<PageTransition><Interviews /></PageTransition>} />
              <Route path="post-job" element={<PageTransition><PostJob /></PageTransition>} />
              <Route path="my-jobs" element={<PageTransition><Jobs /></PageTransition>} />
              <Route index element={<PageTransition><DefaultOverview user={user} goTo={goTo} /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function DefaultOverview({ user, goTo }) {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden bg-[#0F172A] rounded-[3.5rem] p-12 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Recruitment Intelligence Active
            </div>
            <h2 className="text-5xl font-black mb-6 leading-[1.1] tracking-tight">
              Optimize your <br/>
              <span className="text-blue-500 italic">Talent Pipeline.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 font-medium leading-relaxed">
              Hello, {user?.name}. You have 4 new applications to review today and 2 scheduled interviews.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button onClick={() => goTo("post-job")} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                <PlusCircle size={20} /> Create Listing
              </Button>
              <Button onClick={() => goTo("reports")} variant="outline" className="border-slate-700 text-white hover:bg-slate-800 px-8 py-4 rounded-2xl font-black transition-all">
                View Reports
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center relative">
             <div className="w-64 h-64 bg-blue-600/5 border border-blue-500/10 rounded-[4rem] rotate-12 absolute inset-0 animate-pulse"></div>
             <div className="w-64 h-64 bg-slate-800/50 backdrop-blur-sm rounded-[4rem] flex items-center justify-center relative z-10 border border-slate-700 shadow-3xl transform hover:rotate-0 transition-transform duration-700">
                <LayoutDashboard size={80} className="text-blue-500 opacity-80" />
             </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Jobs", value: "12", icon: <Briefcase />, color: "text-blue-600", bg: "bg-blue-50", path: "my-jobs" },
          { label: "Total Apps", value: "154", icon: <Users />, color: "text-indigo-600", bg: "bg-indigo-50", path: "applications" },
          { label: "Interviews", value: "08", icon: <Calendar />, color: "text-rose-600", bg: "bg-rose-50", path: "interviews" },
          { label: "Placement Rate", value: "84%", icon: <Target />, color: "text-emerald-600", bg: "bg-emerald-50", path: "reports" },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => goTo(stat.path)}
            className="group bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
              {React.cloneElement(stat.icon, { size: 24 })}
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}