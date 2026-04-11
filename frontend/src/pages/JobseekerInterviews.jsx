import React, { useState, useEffect, useContext, useCallback } from "react";
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
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Info,
  Trophy,
  Frown
} from "lucide-react";

const JobseekerInterviews = () => {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterviews = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/interviews/user/${user._id}`);
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Interview Fetch Error:", err.response || err);
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
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Syncing Your Journey...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-4">
            <Calendar className="text-blue-600" size={42} />
            My Journey
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-bold">
            Track your progress and review recruiter feedback.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchInterviews}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-black shadow-sm active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-widest"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">
            {interviews.length} Records
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={24} className="text-rose-500 shrink-0" />
          <span className="font-black uppercase text-[11px] tracking-widest">{error}</span>
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[4rem] py-32 text-center shadow-inner">
          <div className="bg-slate-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
            <Calendar size={56} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Empty Roadmap</h3>
          <p className="text-slate-400 mt-3 max-w-sm mx-auto font-bold">
            No interviews have been scheduled yet. Keep applying to jumpstart your career!
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Organization & Role</th>
                  <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Venue</th>
                  <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...interviews].reverse().map((interview) => (
                  <React.Fragment key={interview._id}>
                    <tr className="group hover:bg-slate-50/30 transition-colors">
                      {/* Company & Role */}
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-2xl shadow-slate-200 group-hover:scale-105 transition-transform">
                            {interview.jobId?.companyName?.charAt(0) || "J"}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-slate-900 text-xl tracking-tighter">
                              {interview.jobId?.title || "Role Information Unavailable"}
                            </span>
                            <span className="text-blue-600 font-black flex items-center gap-2 text-[11px] uppercase tracking-widest">
                              <Building2 size={14} />
                              {interview.jobId?.companyName || "Confidential Employer"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="px-10 py-10">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 font-black text-slate-800 text-sm">
                            <Calendar size={18} className="text-blue-600" />
                            {interview.date ? new Date(interview.date).toLocaleDateString("en-US", { 
                              weekday: 'long', month: 'short', day: 'numeric' 
                            }) : "Date Pending"}
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 font-black text-[11px] uppercase tracking-widest">
                            <Clock size={18} />
                            {interview.time || "Time TBD"}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-10 py-10">
                        {interview.location?.toLowerCase().includes("http") ? (
                          <a 
                            href={interview.location} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-black shadow-xl shadow-blue-100 text-[10px] uppercase tracking-widest group/link"
                          >
                            <Video size={16} /> Virtual Link <ExternalLink size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 text-slate-600 font-black bg-slate-100 px-5 py-3 rounded-2xl border border-slate-200 w-fit text-[10px] uppercase tracking-widest">
                            <MapPin size={18} className="text-slate-400" />
                            {interview.location || "Office Location TBD"}
                          </div>
                        )}
                      </td>

                      {/* Outcome & Decision Badge */}
                      <td className="px-10 py-10">
                        <div className="flex flex-col items-center gap-3">
                          {interview.result === 'passed' ? (
                            <span className="w-full max-w-[160px] py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                              <Trophy size={14} /> Selected
                            </span>
                          ) : interview.result === 'failed' ? (
                            <span className="w-full max-w-[160px] py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-100 flex items-center justify-center gap-2">
                              <Frown size={14} /> Not Selected
                            </span>
                          ) : (
                            <span className="w-full max-w-[160px] py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 border-blue-100 flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> In Progress
                            </span>
                          )}

                          {/* Hover Tooltip for Quick View */}
                          {interview.feedback && (
                            <div className="group/fb relative">
                              <div className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest cursor-pointer transition-colors">
                                <MessageSquare size={14} /> Recruiter Note
                              </div>
                              
                              <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-72 bg-slate-900 text-white text-[12px] p-5 rounded-[2rem] opacity-0 group-hover/fb:opacity-100 transition-all pointer-events-none z-50 shadow-2xl font-medium leading-relaxed border border-white/10">
                                <p className="mb-2 text-blue-400 font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
                                  <Info size={12}/> Feedback Message
                                </p>
                                "{interview.feedback}"
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Inline Feedback Section (Persistent Display) */}
                    {interview.feedback && (
                      <tr className="bg-blue-50/20">
                        <td colSpan="4" className="px-10 py-6 border-t border-blue-50/50">
                          <div className="flex items-start gap-5 bg-white/60 p-6 rounded-[2rem] border border-blue-100 shadow-sm">
                            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100 shrink-0">
                              <MessageSquare size={20} />
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Official Feedback from {interview.jobId?.companyName}</span>
                              <p className="text-slate-700 text-base font-bold italic leading-relaxed">
                                "{interview.feedback}"
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase pt-2 tracking-widest flex items-center gap-2">
                                <Info size={12}/> This feedback is provided privately to help your career growth.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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