import React, { useState, useEffect } from "react";
import { 
  FileText, Users, Calendar, TrendingUp, 
  ArrowUpRight, Clock, CheckCircle 
} from "lucide-react";
import apiClient from "../api/client";

export default function EmployerReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        // This endpoint fetches the latest metrics for the logged-in employer
        const { data } = await apiClient.get("/employers/reports");
        setReportData(data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to load recruitment analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">
          Syncing Analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-500 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Performance Insights</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hiring Analytics</h2>
          <p className="text-slate-500 mt-2 font-medium">
            Real-time status updates last synced by Admin.
          </p>
        </div>
        
        {reportData?.lastUpdated && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Updated: {new Date(reportData.lastUpdated).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Jobs Metric */}
        <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={28} />
            </div>
            <ArrowUpRight size={20} className="text-slate-300" />
          </div>
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Active Listings</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-5xl font-black text-slate-900">{reportData?.jobs?.active || 0}</p>
            <span className="text-slate-400 font-bold text-sm">/ {reportData?.jobs?.total || 0} Total</span>
          </div>
        </div>

        {/* Candidates Metric */}
        <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users size={28} />
            </div>
            <ArrowUpRight size={20} className="text-slate-300" />
          </div>
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Applicants</h3>
          <p className="text-5xl font-black text-slate-900 mt-2">{reportData?.applications?.total || 0}</p>
          <div className="mt-4 flex gap-2">
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold uppercase">
              {reportData?.applications?.shortlisted || 0} Shortlisted
            </span>
          </div>
        </div>

        {/* Interviews Metric */}
        <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-rose-50 w-14 h-14 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Calendar size={28} />
            </div>
            <ArrowUpRight size={20} className="text-slate-300" />
          </div>
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Interviews</h3>
          <p className="text-5xl font-black text-slate-900 mt-2">{reportData?.interviews?.total || 0}</p>
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <CheckCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {reportData?.interviews?.completed || 0} Successfully Completed
            </span>
          </div>
        </div>

      </div>

      {/* Helpful Note */}
      <div className="mt-12 p-6 bg-blue-900 rounded-[2rem] text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-800 p-3 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="font-bold">Need a deeper analysis?</p>
            <p className="text-blue-200 text-xs">Contact the platform administrator to request a custom PDF report.</p>
          </div>
        </div>
        <button className="bg-white text-blue-900 px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
          Contact Admin
        </button>
      </div>
    </div>
  );
}