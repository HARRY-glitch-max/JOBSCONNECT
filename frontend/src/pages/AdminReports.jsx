// src/pages/AdminReports.jsx
import React, { useEffect, useState } from "react";
import { 
  BarChart3, Users, Briefcase, Calendar, 
  Send, RefreshCcw, CheckCircle, AlertTriangle 
} from "lucide-react";
import apiClient from "../api/client"; // Use your configured axios client

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Fetches live calculated metrics for the admin to review
      const res = await apiClient.get("/admin/reports");
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load reports:", err.response?.data || err.message);
      setError("Failed to load recruitment metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ✅ New function to "Push" these metrics to the Employer's dashboard
  const handleSyncToEmployer = async () => {
    try {
      setSyncing(true);
      setSyncSuccess(false);
      
      // Hits the POST /api/reports/generate route we created
      await apiClient.post("/reports/generate");
      
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 5000); // Reset success state after 5s
    } catch (err) {
      console.error("Sync error:", err);
      alert("Failed to sync report with employer.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <RefreshCcw className="animate-spin text-blue-600 mr-2" />
      <span className="font-bold text-slate-500 uppercase tracking-tighter">Calculating Live Data...</span>
    </div>
  );

  return (
    <div className="p-8 min-h-screen bg-[#F8FAFC]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Admin Oversight</h2>
          <p className="text-slate-500 font-medium">Reviewing live data for synchronized employer reporting.</p>
        </div>

        <button 
          onClick={handleSyncToEmployer}
          disabled={syncing}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            syncing 
            ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
          }`}
        >
          {syncing ? <RefreshCcw className="animate-spin" size={18} /> : <Send size={18} />}
          {syncing ? "Syncing..." : "Push to Employer Dashboard"}
        </button>
      </div>

      {syncSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={18} />
          <span className="font-bold text-sm uppercase">Success: Reports updated on Employer's Portal</span>
        </div>
      )}

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center gap-3">
          <AlertTriangle />
          <p className="font-semibold">{error}</p>
        </div>
      ) : reports ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Jobs Card */}
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-3 mb-6 text-blue-600">
              <div className="p-3 bg-blue-50 rounded-xl"><Briefcase size={24} /></div>
              <h3 className="font-black uppercase tracking-widest text-xs">Job Distribution</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-500 font-bold">Total Postings</span>
                <span className="text-2xl font-black">{reports.jobs.total}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 text-green-700 rounded-2xl">
                <span className="font-bold">Active</span>
                <span className="text-2xl font-black">{reports.jobs.active}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-100 text-slate-400 rounded-2xl">
                <span className="font-bold">Closed</span>
                <span className="text-2xl font-black">{reports.jobs.closed}</span>
              </div>
            </div>
          </div>

          {/* Applications Card */}
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <div className="p-3 bg-indigo-50 rounded-xl"><Users size={24} /></div>
              <h3 className="font-black uppercase tracking-widest text-xs">Application Funnel</h3>
            </div>
            <div className="space-y-3">
              <StatRow label="Total Candidates" value={reports.applications.total} bold />
              <StatRow label="Shortlisted" value={reports.applications.shortlisted} color="text-green-600" />
              <StatRow label="Hired" value={reports.applications.hired} color="text-blue-600" />
              <StatRow label="Rejected" value={reports.applications.rejected} color="text-rose-500" />
              <StatRow label="Pending Review" value={reports.applications.pending} color="text-amber-500" />
            </div>
          </div>

          {/* Interviews Card */}
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-3 mb-6 text-purple-600">
              <div className="p-3 bg-purple-50 rounded-xl"><Calendar size={24} /></div>
              <h3 className="font-black uppercase tracking-widest text-xs">Engagement</h3>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-purple-50 rounded-3xl text-center">
                <p className="text-purple-400 font-bold text-[10px] uppercase tracking-tighter">Total Interviews</p>
                <p className="text-5xl font-black text-purple-700">{reports.interviews.total}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase">
                <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-center">Scheduled: {reports.interviews.scheduled}</div>
                <div className="p-3 bg-slate-50 text-green-600 rounded-xl text-center">Completed: {reports.interviews.completed}</div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <BarChart3 className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 font-bold">No report data currently available for this entity.</p>
        </div>
      )}
    </div>
  );
}

// Helper Component for the Application List
function StatRow({ label, value, color = "text-slate-700", bold = false }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 font-medium text-sm">{label}</span>
      <span className={`${color} ${bold ? 'font-black text-xl' : 'font-bold'}`}>{value}</span>
    </div>
  );
}