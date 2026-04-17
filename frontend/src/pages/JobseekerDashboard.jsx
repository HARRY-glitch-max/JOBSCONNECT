import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom"; 
import { useContext, useState, useEffect, useCallback } from "react"; 
import apiClient from "../api/client"; 

// Sub-Pages
import Jobs from "./Jobs";
import MyApplications from "./MyApplications";
import Messages from "./Messages"; 
import JobseekerProfile from "./JobseekerProfile";
import JobseekerNotifications from "./JobseekerNotifications";
import JobseekerInterviews from "./JobseekerInterviews";

import { AuthContext } from "../contexts/AuthContext";
import Button from "../components/ui/button";
import { 
  Search, 
  FileText, 
  Mail, 
  User, 
  Bell, 
  Calendar, 
  LogOut,
  Zap,
  CheckCircle
} from "lucide-react";

/**
 * ✅ FIXED: NavItem now correctly accesses 'isActive' 
 * via the NavLink render props pattern.
 */
const NavItem = ({ to, label, icon: Icon, badgeCount }) => (
  <li>
    <NavLink
      to={`/jobseeker/dashboard/${to}`}
      className={({ isActive }) =>
        `flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
          isActive
            ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center space-x-3">
            <Icon 
              size={20} 
              className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"} transition-colors`} 
            />
            <span className="font-bold text-sm tracking-tight">{label}</span>
          </div>
          {badgeCount > 0 && (
            <span className={`${isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"} text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm`}>
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  </li>
);

export default function JobseekerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  
  const [counts, setCounts] = useState({
    unread: 0,
    interviews: 0,
    messages: 0,
    applications: 0
  });

  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING ---
  const fetchDashboardStats = useCallback(async () => {
    // ⚠️ CRITICAL: Check both user and ID to prevent empty fetch loops
    if (!user?._id) return;
    
    try {
      const [notifRes, interviewRes, chatRes, appRes] = await Promise.all([
        apiClient.get(`/notifications/user/${user._id}`),
        apiClient.get(`/interviews/user/${user._id}`),
        apiClient.get(`/chats/user/${user._id}`),
        apiClient.get(`/applications/user/${user._id}`)
      ]);

      setCounts({
        unread: Array.isArray(notifRes.data) ? notifRes.data.filter(n => !n.isRead).length : 0,
        interviews: Array.isArray(interviewRes.data) ? interviewRes.data.length : 0,
        messages: Array.isArray(chatRes.data) ? chatRes.data.length : 0,
        applications: Array.isArray(appRes.data) ? appRes.data.length : 0
      });
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]); // Memoized by User ID

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  const goTo = (path) => navigate(`/jobseeker/dashboard/${path}`);

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col z-30 relative p-8">
        <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={() => navigate("/jobseeker/dashboard")}>
          <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 group-hover:rotate-6 transition-transform">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="text-2xl font-black tracking-tighter">
            Hire<span className="text-blue-600">Flow</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Menu</p>
          <ul className="space-y-2">
            <NavItem to="jobs" label="Browse Jobs" icon={Search} />
            <NavItem to="applications" label="Applications" icon={FileText} badgeCount={counts.applications} />
            <NavItem to="interviews" label="Interviews" icon={Calendar} badgeCount={counts.interviews} />
            <NavItem to="notifications" label="Notifications" icon={Bell} badgeCount={counts.unread} />
            <NavItem to="messages" label="Messages" icon={Mail} badgeCount={counts.messages} />
            <NavItem to="profile" label="My Profile" icon={User} />
          </ul>
        </nav>

        {/* PROFILE CARD */}
        <div className="mt-auto pt-6 border-t border-slate-50">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="relative">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=2563eb&color=fff&bold=true`} 
                className="w-12 h-12 rounded-2xl shadow-sm border border-slate-100"
                alt="Profile" 
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="truncate">
              <p className="text-sm font-black text-slate-900 truncate">{user?.name || "Jobseeker"}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Candidate</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-2xl font-bold text-sm transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-24 flex items-center justify-between px-12 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
              {location.pathname === "/jobseeker/dashboard" 
                ? "Overview" 
                : location.pathname.split('/').pop()?.replace(/-/g, ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Status</p>
              <p className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1.5">
                Online <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              </p>
            </div>
            <button onClick={() => goTo("notifications")} className="p-3 bg-slate-100 text-slate-600 rounded-xl relative hover:bg-blue-50 hover:text-blue-600 transition-all">
              <Bell size={20} />
              {counts.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-white">
                  {counts.unread}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-12 bg-[#F8FAFC]">
          
          {location.pathname === "/jobseeker/dashboard" && (
            <div className="max-w-6xl mx-auto space-y-12">
              <header>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h2>
                <p className="text-slate-500 text-lg font-medium mt-2">Check your latest updates and interview results.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Applications", val: counts.applications, color: "text-blue-600", bg: "bg-blue-50", icon: <FileText />, path: "applications" },
                  { label: "Interviews", val: counts.interviews, color: "text-orange-600", bg: "bg-orange-50", icon: <Calendar />, path: "interviews" },
                  { label: "Messages", val: counts.messages, color: "text-emerald-600", bg: "bg-emerald-50", icon: <Mail />, path: "messages" },
                  { label: "Profile Score", val: "85%", color: "text-purple-600", bg: "bg-purple-50", icon: <CheckCircle />, path: "profile" },
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    onClick={() => goTo(stat.path)}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      {stat.icon}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</h3>
                  </div>
                ))}
              </div>

              <div className="bg-blue-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-black mb-4">Ready for your next role?</h3>
                    <p className="text-blue-100 text-lg font-medium max-w-md">Browse thousands of jobs matched to your skills and get hired by top companies.</p>
                  </div>
                  <Button onClick={() => goTo("jobs")} className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black hover:bg-blue-50 shadow-xl">
                    Explore Jobs
                  </Button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              </div>
            </div>
          )}

          {location.pathname !== "/jobseeker/dashboard" && (
            <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">
              <Routes>
                <Route path="jobs" element={<Jobs />} />
                <Route path="applications" element={<MyApplications />} />
                <Route path="messages" element={<Messages />} />
                <Route path="profile" element={<JobseekerProfile />} />
                <Route path="notifications" element={<JobseekerNotifications refreshBadge={fetchDashboardStats} />} />
                <Route path="interviews" element={<JobseekerInterviews />} />
              </Routes>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}