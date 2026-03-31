import React, { useState, useEffect, useContext, useCallback } from "react";
// ✅ 1. Import your central apiClient
import apiClient from "../api/client"; 
import { AuthContext } from "../contexts/AuthContext";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw,
  Video,
  Building2,
  ChevronRight,
  Loader2
} from "lucide-react";

const JobseekerInterviews = () => {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 2. fetchInterviews simplified using apiClient
  const fetchInterviews = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // ✅ apiClient automatically attaches the Bearer token from 'jobConnectUser'
      // and handles 401 logouts globally.
      const { data } = await apiClient.get(`/interviews/user/${user._id}`);

      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Interview Fetch Error:", err.response || err);
      // Only set error if it's not a 401 (since 401 is handled by the interceptor)
      if (err.response?.status !== 401) {
        setError("Unable to sync your interview schedule. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  if (loading && interviews.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Retrieving your schedule...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="text-blue-600" size={32} />
            Interview Schedule
          </h1>
          <p className="text-slate-500 mt-1 text-lg">
            Track your upcoming meetings and prepare for your next career move.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchInterviews}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-semibold shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <div className="bg-blue-50 text-blue-700 px-5 py-2 rounded-xl font-bold text-sm border border-blue-100 shadow-sm">
            {interviews.length} Total
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-4">
          <AlertCircle size={24} className="text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Content Area */}
      {interviews.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Calendar size={48} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Your calendar is open</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-lg">
            No interviews scheduled at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Company & Position</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Meeting Type</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {interviews.map((interview) => (
                  <tr key={interview._id} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100">
                          {interview.employerId?.companyName?.charAt(0) || "P"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-lg leading-tight">
                            {interview.jobId?.title || "Role Details TBD"}
                          </span>
                          <span className="text-blue-600 font-semibold flex items-center gap-1.5 mt-0.5">
                            <Building2 size={14} />
                            {interview.employerId?.companyName || "Private Employer"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Calendar size={16} className="text-blue-600" />
                          {interview.date ? new Date(interview.date).toLocaleDateString("en-US", { 
                            weekday: 'long', month: 'long', day: 'numeric' 
                          }) : "Date TBD"}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium ml-6">
                          <Clock size={16} />
                          {interview.time || "Time TBD"}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {interview.location?.startsWith("http") ? (
                          <a 
                            href={interview.location} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-100 text-sm group-hover:scale-105"
                          >
                            <Video size={16} /> Join Meeting <ExternalLink size={14} />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-700 font-semibold bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                            <MapPin size={16} className="text-slate-400" />
                            {interview.location || "Office Location"}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset ${
                        interview.status === 'scheduled' 
                          ? 'bg-amber-50 text-amber-700 ring-amber-200' 
                          : 'bg-green-50 text-green-700 ring-green-200'
                      }`}>
                        {interview.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                          <ChevronRight size={24} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobseekerInterviews;