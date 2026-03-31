import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useCallback } from "react"; 
// ✅ Use your custom apiClient instead of raw axios
import apiClient from "../api/client"; 

// Sub-Pages
import Jobs from "./Jobs";
import MyApplications from "./MyApplications";
import ChatPage from "./ChatPage"; 
import ChatSidebar from "../components/chat/ChatSidebar"; 
import JobseekerProfile from "./JobseekerProfile";
import JobseekerNotifications from "./JobseekerNotifications";
import JobseekerInterviews from "./JobseekerInterviews";

import { AuthContext } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import { 
  Search, 
  FileText, 
  Mail, 
  User, 
  Bell, 
  Calendar, 
  LogOut,
  LayoutDashboard 
} from "lucide-react";

const NavItem = ({ to, label, icon: Icon, badgeCount }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`
      }
    >
      <div className="flex items-center space-x-3">
        <Icon size={20} />
        <span className="font-semibold text-sm tracking-tight">{label}</span>
      </div>
      {badgeCount > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full border-2 border-white shadow-sm">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
    </NavLink>
  </li>
);

export default function JobseekerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0); 

  // --- API Fetchers using apiClient (Interceptors handle the Token) ---

  const fetchUnreadCount = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await apiClient.get(`/notifications/user/${user._id}`);
      setUnreadCount(Array.isArray(data) ? data.filter(n => !n.isRead).length : 0);
    } catch (err) { 
      console.error("Unread fetch error:", err.response?.data?.message || err.message); 
    }
  }, [user?._id]);

  const fetchInterviewCount = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await apiClient.get(`/interviews/user/${user._id}`);
      setInterviewCount(Array.isArray(data) ? data.length : 0);
    } catch (err) { 
      console.error("Interview fetch error:", err.response?.data?.message || err.message); 
    }
  }, [user?._id]);

  const fetchMessageCount = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await apiClient.get(`/chats/user/${user._id}`);
      setMessageCount(Array.isArray(data) ? data.length : 0); 
    } catch (err) { 
      console.error("Message fetch error:", err.response?.data?.message || err.message); 
    }
  }, [user?._id]);

  // Handle initial load and polling
  useEffect(() => {
    if (user?._id) {
      fetchUnreadCount();
      fetchInterviewCount();
      fetchMessageCount();

      const interval = setInterval(() => {
          fetchUnreadCount();
          fetchInterviewCount();
          fetchMessageCount();
      }, 30000); 
      return () => clearInterval(interval);
    }
  }, [user?._id, fetchUnreadCount, fetchInterviewCount, fetchMessageCount]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 shrink-0 h-screen sticky top-0">
        <div className="flex items-center space-x-2 mb-10 px-2 cursor-pointer" onClick={() => navigate("/jobseeker/dashboard")}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">H</div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">HireFlow</h2>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          <ul className="space-y-2">
            <NavItem to="jobs" label="Browse Jobs" icon={Search} />
            <NavItem to="applications" label="My Applications" icon={FileText} />
            <NavItem to="interviews" label="Interviews" icon={Calendar} badgeCount={interviewCount} />
            <NavItem to="notifications" label="Notifications" icon={Bell} badgeCount={unreadCount} />
            <NavItem to="messages" label="Messages" icon={Mail} badgeCount={messageCount} />
            <NavItem to="profile" label="Profile" icon={User} />
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 mb-6 px-2">
            <img 
              src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=2563eb&color=fff&bold=true`} 
              className="w-12 h-12 rounded-2xl border-2 border-slate-50 shadow-sm"
              alt="Profile" 
            />
            <div className="overflow-hidden text-ellipsis">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">{user?.name || "Jobseeker"}</p>
              <p className="text-xs text-blue-600 font-medium italic">Verified Candidate</p>
            </div>
          </div>
          <Button
            onClick={logout}
            className="w-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Welcome, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-slate-500 mt-1 text-lg font-medium">
                You have <span className="text-blue-600 font-bold">{unreadCount}</span> new notifications to review.
              </p>
            </div>
            
            <button onClick={() => navigate("notifications")} className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 relative group active:scale-95 transition-all shadow-sm">
              <Bell size={26} className="group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[11px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </header>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group" onClick={() => navigate("applications")}>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileText size={24} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Applications</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">12</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group" onClick={() => navigate("interviews")}>
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Calendar size={24} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Interviews</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{interviewCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group" onClick={() => navigate("messages")}>
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors"><Mail size={24} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Active Chats</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{messageCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><User size={24} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Profile Score</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">85%</h3>
              </div>
          </div>

          <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[700px] flex flex-col overflow-hidden">
            <Routes>
              <Route path="jobs" element={<div className="p-10"><Jobs /></div>} />
              <Route path="applications" element={<div className="p-10"><MyApplications /></div>} />
              
              <Route path="messages/*" element={
                <div className="flex h-[700px]">
                  <ChatSidebar />
                  <div className="flex-1 border-l border-slate-100 overflow-hidden">
                    <Routes>
                      <Route index element={<ChatPage />} />
                      <Route path=":receiverId" element={<ChatPage />} />
                    </Routes>
                  </div>
                </div>
              } />
              
              <Route path="profile" element={<div className="p-10"><JobseekerProfile /></div>} />
              <Route path="notifications" element={<div className="p-10"><JobseekerNotifications refreshBadge={fetchUnreadCount} /></div>} />
              <Route path="interviews" element={<div className="p-10"><JobseekerInterviews /></div>} />
              
              <Route index element={
                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                   <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3 shadow-inner">
                     <LayoutDashboard size={48} />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900">Your Hub</h3>
                   <p className="text-slate-500 mt-3 mb-10 text-lg max-w-md mx-auto leading-relaxed">
                     Track applications, manage interviews, and chat with employers all in one place.
                   </p>
                   <Button onClick={() => navigate("jobs")} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all">
                     Explore Opportunities
                   </Button>
                </div>
              } />
            </Routes>
          </section>
        </div>
      </main>
    </div>
  );
}