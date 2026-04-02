import { useContext, useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Users, Calendar, 
  ArrowRight, UserCircle 
} from "lucide-react";

import Button from "../components/ui/Button";
import { AuthContext } from "../contexts/AuthContext";
import { getAdminReports } from "../api/admin";

// ✅ Import the actual components (ensure the paths match your file structure)
import AdminReports from "./AdminReports";
// import AdminProfile from "./AdminProfile"; 

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [stats, setStats] = useState({
    jobs: { total: 0 },
    applications: { total: 0 },
    interviews: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminReports();
        if (data) setStats(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        setError("Unable to load latest stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* --- CONSTANT HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h2>
            <p className="text-slate-500 font-medium">
              Monitoring activity for <span className="text-blue-600">{(user?.employerId?.companyName) || "the Organization"}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <div className="px-4 border-r border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Administrator</p>
              <p className="text-sm font-bold text-slate-700">{user?.name || "Admin"}</p>
            </div>
            <button
              onClick={logout}
              className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* --- NESTED ROUTES --- */}
        <Routes>
          {/* 1. Main Dashboard View */}
          <Route path="/" element={
            <div className="animate-in fade-in duration-500">
              {error && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-sm flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <StatCard title="Total Jobs" value={stats?.jobs?.total} loading={loading} icon={<FileText size={24} />} lightColor="bg-blue-50 text-blue-600" />
                <StatCard title="Total Applications" value={stats?.applications?.total} loading={loading} icon={<Users size={24} />} lightColor="bg-purple-50 text-purple-600" />
                <StatCard title="Interviews" value={stats?.interviews?.total} loading={loading} icon={<Calendar size={24} />} lightColor="bg-orange-50 text-orange-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ActionCard 
                  title="Detailed Reports" 
                  desc="Deep dive into specific metrics, filtered by job status and outcomes."
                  icon={<LayoutDashboard size={28} />}
                  color="bg-blue-600"
                  btnText="View Analytics"
                  onClick={() => navigate("reports")} 
                />
                <ActionCard 
                  title="Account Settings" 
                  desc="Update your administrative credentials and profile information."
                  icon={<UserCircle size={28} />}
                  color="bg-indigo-600"
                  btnText="Edit Profile"
                  onClick={() => navigate("profile")} 
                />
              </div>
            </div>
          } />

          {/* 2. Real Analytics Page */}
          <Route path="reports" element={
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4 duration-300">
               <Button 
                 onClick={() => navigate("/admin/dashboard")} 
                 variant="outline" 
                 className="mb-6 border-slate-200 text-slate-600 hover:bg-slate-50"
               >
                 ← Back to Overview
               </Button>
               {/* ✅ This now renders your colored cards component */}
               <AdminReports /> 
            </div>
          } />

          {/* 3. Placeholder for Profile (Replace with <AdminProfile /> when ready) */}
          <Route path="profile" element={
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
               <Button onClick={() => navigate("/admin/dashboard")} className="mb-4">← Back</Button>
               <h3 className="text-2xl font-bold">Admin Profile</h3>
               <p className="text-slate-500 mt-2">Profile editing form will render here.</p>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Keep these at the bottom) ---

function StatCard({ title, value, loading, icon, lightColor }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex items-center gap-6">
      <div className={`${lightColor} w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg" />
        ) : (
          <p className="text-3xl font-black text-slate-900 truncate">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, color, btnText, onClick }) {
  return (
    <div className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300">
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-8 leading-relaxed font-medium">{desc}</p>
      <Button 
        className="w-full h-14 rounded-2xl justify-between px-6 bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-md" 
        onClick={onClick}
      >
        <span className="font-bold">{btnText}</span>
        <ArrowRight size={20} />
      </Button>
    </div>
  );
}