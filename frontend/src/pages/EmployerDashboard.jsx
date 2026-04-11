import React, { useContext, useEffect, useState, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare, PlusCircle, Briefcase, Users,
  Calendar, UserCircle, LogOut, Bell,
  TrendingUp, Sparkles, Search, Target,
  Zap, Globe, ChevronRight, BarChart3
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
import { useSocket } from "../hooks/useSocket";
import Button from "../components/ui/Button";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const socket = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- 1. DATA FETCHING ---
  const fetchNotifications = useCallback(async () => {
    const uid = user?._id || user?.id;
    if (!uid) return;
    try {
      const res = await apiClient.get(`/notifications/user/${uid}`);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Notification Fetch Error:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- 2. REAL-TIME SOCKET EVENTS ---
  useEffect(() => {
    const uid = user?._id || user?.id;
    if (!socket || !uid) return;
    
    socket.emit("join", uid);

    socket.on("new_notification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    socket.on("new_conversation_notification", () => {
      setTimeout(fetchNotifications, 500);
    });

    return () => {
      socket.off("new_notification");
      socket.off("new_conversation_notification");
    };
  }, [socket, user, fetchNotifications]);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  // --- 3. DYNAMIC HEADER LOGIC ---
  const getHeaderTitle = () => {
    if (location.state?.receiverName) return `Chat: ${location.state.receiverName}`;
    
    const path = location.pathname;
    if (path.includes("/messages")) return "Message Center";
    if (path.includes("/interviews")) return "Interview Schedule";
    if (path.includes("/post-job")) return "Create New Opening";
    if (path.includes("/my-jobs")) return "Job Listings";
    if (path.includes("/applications")) return "Applicant Tracking";
    if (path.includes("/reports")) return "Performance Analytics";
    if (path.includes("/notifications")) return "Alerts & Updates";
    
    return "Dashboard Overview";
  };

  // --- 4. NAVIGATION CONFIG ---
  const navItems = [
    { to: "reports", label: "Analytics", icon: <BarChart3 size={20} /> },
    { to: "notifications", label: "Alerts", icon: <Bell size={20} />, badge: unreadCount },
    { to: "interviews", label: "Interviews", icon: <Calendar size={20} /> },
    { to: "messages", label: "Messages", icon: <MessageSquare size={20} /> },
    { to: "post-job", label: "Post a Job", icon: <PlusCircle size={20} /> },
    { to: "my-jobs", label: "My Listings", icon: <Briefcase size={20} /> },
    { to: "applications", label: "Talent Pool", icon: <Users size={20} /> },
  ];

  const goTo = (path) => navigate(`/employer/dashboard/${path}`);

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR */}
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

        <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Main Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/employer/dashboard/${item.to}`}
              className={({ isActive }) =>
                `flex items-center justify-between px-5 py-4 rounded-[1.25rem] transition-all duration-300 group relative ${
                  isActive || (item.to === "messages" && location.pathname.includes("/messages"))
                    ? "bg-blue-600/10 text-blue-400 translate-x-2" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`
              }
            >
              <div className="flex items-center gap-4">
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
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

        {/* PROFILE CARD */}
        <div className="m-6 p-6 rounded-[2rem] bg-gradient-to-b from-slate-800/40 to-slate-900/60 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl border-4 border-slate-800 shadow-xl">
              {user?.companyName?.charAt(0) || "C"}
            </div>
            <div className="truncate">
              <p className="text-white font-bold text-sm truncate">{user?.companyName || "Organization"}</p>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Employer Hub</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => goTo("profile")} className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all flex justify-center" title="Settings"><UserCircle size={18} /></button>
            <button onClick={logout} className="py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex justify-center" title="Logout"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-12 bg-white/60 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Employer Workspace</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
              {getHeaderTitle()}
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
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Cloud Active
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#F8FAFC]">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="messages" element={<PageTransition><ChatPage /></PageTransition>} />
              <Route path="messages/:id" element={<PageTransition><ChatPage /></PageTransition>} />
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
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative overflow-hidden bg-white rounded-[3rem] p-12 lg:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] border border-slate-100 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-10 border border-blue-100">
              <Sparkles size={14} /> AI Recruitment Suite
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tight">
              Scale your <br/>
              <span className="text-blue-600">Organization.</span>
            </h2>
            <p className="text-slate-500 text-lg lg:text-xl mb-12 font-medium max-w-lg leading-relaxed">
              Hello, {user?.companyName || 'Partner'}. You have new applicants and scheduled sessions requiring your attention today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => goTo("post-job")} className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-slate-200">
                <PlusCircle size={20} /> Post Opening
              </Button>
              <Button onClick={() => goTo("interviews")} variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50 px-8 py-4 rounded-2xl font-black transition-all">
                View Calendar
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0F1D] rounded-[3rem] p-10 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden shadow-3xl">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px]"></div>
          <div>
            <h4 className="text-2xl font-black tracking-tight mb-2">Hiring Velocity</h4>
            <p className="text-slate-500 font-bold text-sm italic">Candidate pipeline health</p>
          </div>
          <div className="mt-10">
            <span className="text-7xl font-black tracking-tighter text-blue-500">84%</span>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest mt-4">
                <TrendingUp size={16} /> Optimized Flow
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {[
          { label: "Active Jobs", value: "12", color: "text-blue-600", bg: "bg-blue-50", icon: <Briefcase />, path: "my-jobs" },
          { label: "New Talent", value: "154", color: "text-slate-900", bg: "bg-slate-100", icon: <Users />, path: "applications" },
          { label: "Interviews", value: "08", color: "text-indigo-600", bg: "bg-indigo-50", icon: <Calendar />, path: "interviews" },
          { label: "Messages", value: "03", color: "text-emerald-600", bg: "bg-emerald-50", icon: <MessageSquare />, path: "messages" },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => goTo(stat.path)}
            className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group cursor-pointer border-b-4 border-b-transparent hover:border-b-blue-600"
          >
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