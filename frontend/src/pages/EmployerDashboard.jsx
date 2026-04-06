import React, { useContext, useEffect, useState, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare, PlusCircle, Briefcase, Users,
  Calendar, UserCircle, LogOut, Bell,
  TrendingUp, Sparkles, Search, Target,
  LayoutDashboard, ChevronRight, Zap, Globe
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

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await apiClient.get(`/notifications/user/${user._id}`);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  }, [user?._id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleNewNotification = useCallback((newNotif) => {
    setNotifications((prev) => prev.find(n => n._id === newNotif._id) ? prev : [newNotif, ...prev]);
  }, []);

  useEffect(() => {
    if (!socket || !user?._id) return;
    socket.emit("join", user._id);
    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [user?._id, handleNewNotification]);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  const navItems = [
    { to: "reports", label: "Analytics", icon: <TrendingUp size={20} /> },
    { to: "notifications", label: "Alerts", icon: <Bell size={20} />, badge: unreadCount },
    { to: "interviews", label: "Interviews", icon: <Calendar size={20} /> },
    { to: "chat", label: "Messages", icon: <MessageSquare size={20} /> },
    { to: "post-job", label: "Create Job", icon: <PlusCircle size={20} /> },
    { to: "my-jobs", label: "Manage Listings", icon: <Briefcase size={20} /> },
    { to: "applications", label: "Talent Pool", icon: <Users size={20} /> },
  ];

  const goTo = (path) => navigate(`/employer/dashboard/${path}`);

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans text-slate-900 overflow-hidden">
      
      {/* ================= SIDEBAR (Ultra-Modern Dark) ================= */}
      <aside className="w-80 bg-[#0A0F1D] flex flex-col z-30 relative shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)]">
        <div className="p-10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/employer/dashboard")}>
            <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-600/40 rotate-3 group-hover:rotate-12 transition-all">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              Hire<span className="text-blue-500">Flow</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Navigation</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/employer/dashboard/${item.to}`}
              className={({ isActive }) =>
                `flex items-center justify-between px-5 py-4 rounded-[1.25rem] transition-all duration-500 group relative ${
                  isActive 
                    ? "bg-white/10 text-white translate-x-2" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`
              }
            >
              <div className="flex items-center gap-4">
                <span className="opacity-80 group-hover:scale-110 group-hover:text-blue-400 transition-all">{item.icon}</span>
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile Card */}
        <div className="m-6 p-6 rounded-[2rem] bg-gradient-to-b from-slate-800/40 to-slate-900/60 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl border-4 border-slate-800 shadow-xl">
              {user?.companyName?.charAt(0) || "C"}
            </div>
            <div className="truncate">
              <p className="text-white font-bold text-sm truncate">{user?.companyName || "Organization"}</p>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Premium Tier</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => goTo("profile")} className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all flex justify-center"><UserCircle size={18} /></button>
            <button onClick={logout} className="py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex justify-center"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT (Light & Airy) ================= */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-12 bg-white/60 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Current Workspace</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
              {location.pathname.split("/").pop().replace("-", " ") || "Overview"}
            </h1>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative group hidden lg:block">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Find candidates..." 
                className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 w-64 transition-all" 
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                <Globe size={18} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Status</p>
                <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> System Live
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#F8FAFC]">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="chat" element={<PageTransition><ChatPage /></PageTransition>} />
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-7xl mx-auto space-y-12"
    >
      {/* Dynamic Hero Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative overflow-hidden bg-white rounded-[3rem] p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] border border-slate-100 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-10 border border-blue-100">
              <Sparkles size={14} /> Intelligence Engine Active
            </div>
            <h2 className="text-6xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tight">
              Scale your <br/>
              <span className="text-blue-600">Dream Team.</span>
            </h2>
            <p className="text-slate-500 text-xl mb-12 font-medium max-w-lg leading-relaxed">
              Welcome back, {user?.name?.split(' ')[0]}. You have <span className="text-slate-900 font-black">12 active</span> listings and <span className="text-slate-900 font-black">4 interviews</span> today.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => goTo("post-job")} className="bg-slate-900 hover:bg-blue-600 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 transition-all shadow-2xl active:scale-95">
                <PlusCircle size={20} /> Post Opening
              </Button>
              <Button onClick={() => goTo("reports")} variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50 px-10 py-5 rounded-2xl font-black transition-all">
                Analytics
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0F1D] rounded-[3rem] p-12 text-white flex flex-col justify-between relative overflow-hidden shadow-3xl">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px]"></div>
          <div>
            <h4 className="text-2xl font-black tracking-tight mb-2">Hiring Rate</h4>
            <p className="text-slate-500 font-bold text-sm italic">Compared to last month</p>
          </div>
          <div className="mt-10">
            <span className="text-7xl font-black tracking-tighter text-blue-500">84%</span>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest mt-4">
               <TrendingUp size={16} /> +12.5% Growth
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Active Listings", value: "12", color: "text-blue-600", bg: "bg-blue-50", icon: <Briefcase /> },
          { label: "Total Applicants", value: "154", color: "text-slate-900", bg: "bg-slate-100", icon: <Users /> },
          { label: "Scheduled", value: "08", color: "text-indigo-600", bg: "bg-indigo-50", icon: <Calendar /> },
          { label: "Talent Score", value: "9.2", color: "text-blue-600", bg: "bg-blue-50", icon: <Target /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer border-b-4 border-b-transparent hover:border-b-blue-600">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}