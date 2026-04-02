import React, { useContext, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  MessageSquare, PlusCircle, Briefcase, Users, Calendar,
  UserCircle, LogOut, LayoutDashboard, ChevronRight, Bell
} from "lucide-react";

import ChatPage from "./ChatPage";
import PostJob from "./PostJob";
import Interviews from "./Interviews";
import Jobs from "./Jobs";
import EmployerApplications from "./EmployerApplications";
import { AuthContext } from "../contexts/AuthContext";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  // Helper flags for UI styling based on current route
  const isApplicationsPage = location.pathname.includes("applications");
  // Supports both 'chat' and 'messages' keywords for styling consistency
  const isChatActive = location.pathname.includes("chat") || location.pathname.includes("messages");

  const navItems = [
    { to: "interviews", label: "Interviews", icon: <Calendar size={18} /> },
    { to: "chat", label: "Messages", icon: <MessageSquare size={18} /> },
    { to: "post-job", label: "Post a Job", icon: <PlusCircle size={18} /> },
    { to: "my-jobs", label: "My Jobs", icon: <Briefcase size={18} /> },
    { to: "applications", label: "Applications", icon: <Users size={18} /> },
  ];

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
                // Ensure chat stays active even if a receiverId is in the URL
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

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm uppercase">
              {user?.name?.charAt(0) || "E"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Employer"}</p>
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
        
        {/* Persistent Header */}
        <header className={`h-20 flex items-center justify-between px-10 shrink-0 z-20 transition-colors duration-300 ${
          isApplicationsPage ? "bg-slate-900 text-white border-b border-slate-800" : "bg-white/80 backdrop-blur-md border-b border-slate-200"
        }`}>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{getPageTitle()}</h1>
            <p className={`text-xs font-medium mt-0.5 ${isApplicationsPage ? "text-slate-400" : "text-slate-500"}`}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <button className={`p-2 rounded-full transition-colors ${isApplicationsPage ? "hover:bg-slate-800" : "hover:bg-slate-100 text-slate-400"}`}>
              <Bell size={20} />
            </button>
            <div className={`h-6 w-[1px] ${isApplicationsPage ? "bg-slate-700" : "bg-slate-200"}`}></div>
            <button 
              onClick={() => navigate("post-job")} 
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              Post New Job
            </button>
          </div>
        </header>

        {/* --- 3. DYNAMIC CONTENT SCROLL ZONE --- */}
        <div className={`flex-1 overflow-y-auto transition-colors duration-300 ${
          isApplicationsPage ? "bg-slate-900" : "bg-slate-50"
        }`}>
          <Routes>
            {/* FULL-WIDTH PAGES: Parity with Jobseeker route structure */}
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:receiverId" element={<ChatPage />} />
            
            <Route path="applications" element={<EmployerApplications />} />

            {/* BOXED PAGES: (Jobs, Interviews, etc.) */}
            <Route
              path="*"
              element={
                <div className="p-8 max-w-7xl mx-auto w-full">
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 min-h-[75vh]">
                    <Routes>
                      <Route path="/" element={<DefaultOverview />} />
                      <Route path="interviews" element={<Interviews />} />
                      <Route path="post-job" element={<PostJob />} />
                      <Route path="my-jobs" element={<Jobs />} />
                      {/* Fallback to Overview for unknown dashboard routes */}
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

function DefaultOverview() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-blue-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 text-blue-600 shadow-inner">
        <LayoutDashboard size={40} />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Employer Dashboard</h2>
      <p className="text-slate-500 mt-3 max-w-sm leading-relaxed font-medium">
        Review your latest applications, schedule interviews, and manage your job postings from one central hub.
      </p>
    </div>
  );
}