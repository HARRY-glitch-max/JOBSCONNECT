import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, FileText, Users, Calendar, 
  ArrowRight, UserCircle, Send, LogOut, ShieldCheck,
  Activity, Settings
} from "lucide-react";

import Button from "../components/ui/Button";
import PageTransition from "../components/PageTransition";
import { AuthContext } from "../contexts/AuthContext";
import { getAdminReports, generateNewReport } from "../api/admin";
import AdminReports from "./AdminReports";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [stats, setStats] = useState({
    jobs: { total: 0 },
    applications: { total: 0 },
    interviews: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Absolute navigation helper
  const goTo = (path) => navigate(`/admin/dashboard/${path}`);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminReports();
      if (data) setStats(data);
      setError(null);
    } catch (err) {
      console.error("Fetch Stats Error:", err);
      setError("Unable to load latest dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  const handleSendReport = async () => {
    const companyName = user?.employerId?.companyName || "the Organization";
    if (!window.confirm(`Generate a real-time status report and notify ${companyName}?`)) return;
    
    setGenerating(true);
    try {
      await generateNewReport();
      alert("Success! The report has been sent to the employer's notification center.");
    } catch (err) {
      alert("Action Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 font-sans text-slate-900 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* --- DASHBOARD HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
                <ShieldCheck size={12} /> Root Administrator
               </span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Portal Overview</h2>
            <p className="text-slate-500 font-medium text-lg">
              Monitoring <span className="text-blue-600 font-bold">{(user?.employerId?.companyName) || "the Organization"}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
            <div className="px-5 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Active Admin</p>
              <p className="text-sm font-bold text-slate-700">{user?.name || "Access User"}</p>
            </div>
            <button 
              onClick={logout} 
              className="group bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
            >
              Logout <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </header>

        {/* --- TRANSITIONING CONTENT AREA --- */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            
            {/* Main Stats and Action Overview */}
            <Route path="/" element={
              <PageTransition>
                {error && (
                  <div className="mb-8 p-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-[1.5rem] text-sm font-bold flex items-center gap-4 shadow-sm">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                    {error}
                  </div>
                )}

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  <StatCard title="Live Job Postings" value={stats?.jobs?.total} loading={loading} icon={<FileText size={24} />} lightColor="bg-blue-50 text-blue-600" />
                  <StatCard title="Active Applicants" value={stats?.applications?.total} loading={loading} icon={<Users size={24} />} lightColor="bg-purple-50 text-purple-600" />
                  <StatCard title="Interviews Logged" value={stats?.interviews?.total} loading={loading} icon={<Calendar size={24} />} lightColor="bg-orange-50 text-orange-600" />
                </div>

                {/* --- ACTIONS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <ActionCard 
                    title="Send Report" 
                    desc="Instantly sync hiring metrics and trigger a real-time alert for the employer."
                    icon={<Send size={28} />}
                    color="bg-emerald-500"
                    btnText={generating ? "Syncing..." : "Notify Employer"}
                    onClick={handleSendReport}
                    isLoading={generating}
                  />
                  <ActionCard 
                    title="Analytics Hub" 
                    desc="Explore historical success rates, time-to-hire, and demographic trends."
                    icon={<Activity size={28} />}
                    color="bg-blue-600"
                    btnText="Open Analytics"
                    onClick={() => goTo("reports")} 
                  />
                  <ActionCard 
                    title="Admin Config" 
                    desc="Manage security protocols, permissions, and administrative account logs."
                    icon={<Settings size={28} />}
                    color="bg-slate-900"
                    btnText="Go to Settings"
                    onClick={() => goTo("profile")} 
                  />
                </div>
              </PageTransition>
            } />

            {/* Reports Route */}
            <Route path="reports" element={
              <PageTransition>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px]">
                   <Button onClick={() => navigate("/admin/dashboard")} variant="outline" className="mb-10 px-8 py-3 rounded-xl border-slate-200 hover:bg-slate-50 font-bold transition-all flex items-center gap-2">
                     ← Return to Dashboard
                   </Button>
                   <AdminReports /> 
                </div>
              </PageTransition>
            } />

            {/* Profile/Settings Route */}
            <Route path="profile" element={
              <PageTransition>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px]">
                   <Button onClick={() => navigate("/admin/dashboard")} variant="outline" className="mb-10 px-8 py-3 rounded-xl border-slate-200 font-bold transition-all">
                     ← Return to Dashboard
                   </Button>
                   <div className="max-w-2xl">
                     <h3 className="text-3xl font-black text-slate-900">Administrative Profile</h3>
                     <p className="text-slate-500 mt-2 text-lg font-medium leading-relaxed mb-8">
                       Configure your administrative credentials, multi-factor authentication, and portal access logs.
                     </p>
                     <div className="p-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
                          <ShieldCheck size={32} className="text-blue-600" />
                        </div>
                        <p className="font-black text-slate-400 uppercase tracking-widest text-[11px]">Identity Management System Locked</p>
                        <p className="text-sm text-slate-500 mt-2">Only Root Administrators can modify these settings.</p>
                     </div>
                   </div>
                </div>
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, loading, icon, lightColor }) {
  return (
    <div className="bg-white border border-slate-200/60 p-7 rounded-[2.5rem] shadow-sm flex items-center gap-6 transition-all hover:shadow-xl hover:-translate-y-1.5 duration-300 group">
      <div className={`${lightColor} w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 leading-none">{title}</p>
        {loading ? (
          <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-xl mt-1" />
        ) : (
          <p className="text-3xl font-black text-slate-900 truncate tracking-tight">
            {(value ?? 0).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, color, btnText, onClick, isLoading }) {
  return (
    <div className="group bg-white border border-slate-200/60 rounded-[3rem] p-9 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 flex flex-col justify-between h-full">
      <div>
        <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg transform group-hover:rotate-12 transition-all duration-500 group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
        <p className="text-slate-500 mb-10 leading-relaxed font-medium text-sm italic opacity-80">{desc}</p>
      </div>
      <Button 
        className={`w-full h-14 rounded-2xl justify-between px-7 transition-all shadow-lg active:scale-95 ${
          isLoading 
            ? 'bg-slate-300 cursor-wait' 
            : 'bg-[#0F172A] hover:bg-blue-600 text-white'
        }`}
        onClick={onClick}
        disabled={isLoading}
      >
        <span className="font-black uppercase tracking-[0.1em] text-xs">{btnText}</span>
        {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />}
      </Button>
    </div>
  );
}