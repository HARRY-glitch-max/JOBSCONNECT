import { useContext, useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Users, Calendar, 
  ArrowRight, UserCircle, Send 
} from "lucide-react";

import Button from "../components/ui/Button";
import { AuthContext } from "../contexts/AuthContext";
import { getAdminReports, generateNewReport } from "../api/admin";

import AdminReports from "./AdminReports";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [stats, setStats] = useState({
    jobs: { total: 0 },
    applications: { total: 0 },
    interviews: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
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
  };

  const handleSendReport = async () => {
    // ✅ Extracting company name from the populated employerId object
    const companyName = user?.employerId?.companyName || "the Organization";
    
    if (!window.confirm(`Generate a real-time status report and notify ${companyName}?`)) return;
    
    setGenerating(true);
    try {
      await generateNewReport();
      alert("Success! The report has been generated and sent to the employer's notification center.");
    } catch (err) {
      alert("Action Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* --- DASHBOARD HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="animate-in slide-in-from-left duration-500">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h2>
            <p className="text-slate-500 font-medium mt-1">
              {/* ✅ Correctly accessing populated employerId object */}
              Monitoring activity for <span className="text-blue-600 font-bold">{(user?.employerId?.companyName) || "the Organization"}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-right duration-500">
            <div className="px-4 border-r border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Primary Admin</p>
              <p className="text-sm font-bold text-slate-700">{user?.name || "Access User"}</p>
            </div>
            <button 
              onClick={logout} 
              className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        <Routes>
          <Route path="/" element={
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              {error && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-sm flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  {error}
                </div>
              )}

              {/* --- STATS GRID --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <StatCard title="Live Job Postings" value={stats?.jobs?.total} loading={loading} icon={<FileText size={24} />} lightColor="bg-blue-50 text-blue-600" />
                <StatCard title="Active Applicants" value={stats?.applications?.total} loading={loading} icon={<Users size={24} />} lightColor="bg-purple-50 text-purple-600" />
                <StatCard title="Interviews Logged" value={stats?.interviews?.total} loading={loading} icon={<Calendar size={24} />} lightColor="bg-orange-50 text-orange-600" />
              </div>

              {/* --- ACTIONS GRID --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ActionCard 
                  title="Send Report" 
                  desc="Instantly sync hiring metrics and trigger an alert for the employer."
                  icon={<Send size={28} />}
                  color="bg-emerald-600"
                  btnText={generating ? "Generating..." : "Notify Employer"}
                  onClick={handleSendReport}
                  isLoading={generating}
                />
                
                <ActionCard 
                  title="Detailed Analytics" 
                  desc="Explore deep-dive trends, success rates, and historical logs."
                  icon={<LayoutDashboard size={28} />}
                  color="bg-blue-600"
                  btnText="Explore Reports"
                  onClick={() => navigate("reports")} 
                />

                <ActionCard 
                  title="Portal Settings" 
                  desc="Modify administrative permissions and profile security settings."
                  icon={<UserCircle size={28} />}
                  color="bg-indigo-600"
                  btnText="Profile Settings"
                  onClick={() => navigate("profile")} 
                />
              </div>
            </div>
          } />

          <Route path="reports" element={
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
               <Button onClick={() => navigate("/admin/dashboard")} variant="outline" className="mb-6 hover:bg-slate-50">
                 ← Return to Overview
               </Button>
               <AdminReports /> 
            </div>
          } />

          <Route path="profile" element={
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
               <Button onClick={() => navigate("/admin/dashboard")} variant="outline" className="mb-6">
                 ← Return to Overview
               </Button>
               <h3 className="text-2xl font-black text-slate-900">Administrative Profile</h3>
               <p className="text-slate-500 mt-2 font-medium">Configure your admin credentials and account preferences.</p>
               {/* Profile Form Component would go here */}
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---

function StatCard({ title, value, loading, icon, lightColor }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex items-center gap-6 transition-transform hover:scale-[1.02] duration-300">
      <div className={`${lightColor} w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-lg" />
        ) : (
          <p className="text-3xl font-black text-slate-900 truncate">
            {(value ?? 0).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, color, btnText, onClick, isLoading }) {
  return (
    <div className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col justify-between">
      <div>
        <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 mb-8 leading-relaxed font-medium line-clamp-2">{desc}</p>
      </div>
      <Button 
        className={`w-full h-14 rounded-2xl justify-between px-6 transition-all shadow-md active:scale-95 ${
          isLoading 
            ? 'bg-slate-300 cursor-wait' 
            : 'bg-slate-900 hover:bg-slate-800 text-white'
        }`}
        onClick={onClick}
        disabled={isLoading}
      >
        <span className="font-bold tracking-tight">{btnText}</span>
        {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
      </Button>
    </div>
  );
}