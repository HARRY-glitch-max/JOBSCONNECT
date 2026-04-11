import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  getEmployerApplications,
  getEmployerJobs,
} from "../services/api"; 
import { 
  getInterviewsByJob, 
  bookInterview, 
  updateInterviewResult, 
  deleteInterview 
} from "../api/interviews";
import { AuthContext } from "../contexts/AuthContext";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  User, 
  Briefcase,
  PlusCircle,
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";

export default function EmployerInterviews() {
  const { user } = useContext(AuthContext);

  // Core Data State
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]); 
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  // Feedback Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [decisionType, setDecisionType] = useState(""); // 'passed' or 'failed'
  const [feedbackText, setFeedbackText] = useState("");

  const [form, setForm] = useState({ 
    jobId: "", 
    candidateId: "", 
    date: "", 
    time: "", 
    location: "" 
  });

  const employerId = user?.employerId || user?._id;

  const fetchData = useCallback(async () => {
    if (!employerId) return;
    try {
      setLoading(true);
      const [appsRes, jobsRes] = await Promise.all([
        getEmployerApplications(employerId),
        getEmployerJobs(employerId),
      ]);

      const activeJobs = jobsRes.data || [];
      setJobs(activeJobs);
      setApplications((appsRes.data || []).filter(app => app.status === "shortlisted"));

      const interviewPromises = activeJobs.map(job => getInterviewsByJob(job._id));
      const interviewResults = await Promise.all(interviewPromises);
      setInterviews(interviewResults.flat().filter(Boolean));
    } catch (err) {
      setError("Failed to sync management portal.");
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    if (employerId) fetchData();
  }, [employerId, fetchData]);

  // --- Decision Logic ---
  const openDecisionModal = (interview, type) => {
    setSelectedInterview(interview);
    setDecisionType(type);
    setFeedbackText(""); // Clear previous input
    setShowModal(true);
  };

  const handleFinalDecision = async () => {
    if (!feedbackText.trim()) {
      alert("Please provide some feedback for the candidate.");
      return;
    }

    try {
      await updateInterviewResult(selectedInterview._id, { 
        result: decisionType, 
        feedback: feedbackText 
      });
      setShowModal(false);
      fetchData(); // Refresh list to show updated status and feedback
    } catch (err) {
      setError("Could not update decision.");
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await bookInterview(form.jobId, {
        applicantId: form.candidateId,
        date: form.date,
        time: form.time,
        location: form.location || "Online/TBD",
      });
      setForm({ jobId: "", candidateId: "", date: "", time: "", location: "" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Scheduling error.");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      await deleteInterview(id);
      fetchData();
    } catch (err) {
      setError("Delete failed.");
    }
  };

  const filteredInterviews = interviews.filter(i => {
    if (filter === "all") return true;
    return i.result === filter;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Loading Portal...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 bg-slate-50/20 min-h-screen relative">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Recruitment Hub</h2>
          <p className="text-slate-500 font-bold">Bridge the gap between talent and your company</p>
        </div>
        {error && <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black border border-rose-100 uppercase">{error}</div>}
      </header>

      {/* SCHEDULING FORM */}
      <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <h3 className="text-xl font-black mb-8 text-slate-800 flex items-center gap-3">
          <PlusCircle className="text-blue-600" /> Schedule New Session
        </h3>
        <form onSubmit={handleSchedule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Job Role</label>
            <select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value, candidateId: "" })} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" required>
              <option value="">Select posting</option>
              {jobs.map(job => <option key={job._id} value={job._id}>{job.title}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Shortlisted Talent</label>
            <select value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all disabled:opacity-50" disabled={!form.jobId} required>
              <option value="">Select candidate</option>
              {applications.filter(app => String(app.jobId?._id || app.jobId) === String(form.jobId)).map(app => (
                <option key={app.userId?._id} value={app.userId?._id}>{app.userId?.fullName || app.userId?.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Location / Link</label>
            <input type="text" placeholder="Zoom link or Office address" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Time</label>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" required />
          </div>
          <button type="submit" className="lg:mt-8 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95 text-xs uppercase tracking-widest">
            Dispatch Invite
          </button>
        </form>
      </section>

      {/* ACTIVE SCHEDULE LIST */}
      <section className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
          <h3 className="text-xl font-black text-slate-900 uppercase">Interview Timeline</h3>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {['all', 'pending', 'passed', 'failed'].map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {filteredInterviews.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-300">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-black uppercase text-xs tracking-widest">No matching sessions</p>
            </div>
          ) : (
            [...filteredInterviews].reverse().map(i => (
              <div key={i._id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6 hover:shadow-2xl hover:border-blue-100 transition-all">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center border border-slate-100">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-slate-900 tracking-tight">{i.jobId?.title || "Role Details TBD"}</h4>
                      <p className="text-blue-600 text-[12px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <User size={14} /> {i.userId?.fullName || i.userId?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-5 text-[11px] font-black uppercase text-slate-400">
                    <span className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> {new Date(i.date).toLocaleDateString()}</span>
                    <span className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2"><Clock size={14} className="text-blue-500" /> {i.time}</span>
                    <span className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-[200px] truncate"><MapPin size={14} className="text-blue-500" /> {i.location}</span>
                  </div>

                  {i.feedback && (
                    <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border-l-4 border-blue-400">
                      <MessageSquare size={16} className="text-blue-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Feedback sent to candidate</p>
                        <p className="text-[13px] text-slate-700 font-medium italic">"{i.feedback}"</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[2rem]">
                  {i.result === "pending" ? (
                    <>
                      <button onClick={() => openDecisionModal(i, 'passed')} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-lg shadow-emerald-200">Pass</button>
                      <button onClick={() => openDecisionModal(i, 'failed')} className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-lg shadow-rose-200">Fail</button>
                    </>
                  ) : (
                    <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-2 ${i.result === 'passed' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-rose-200 text-rose-600 bg-rose-50'}`}>
                      {i.result === 'passed' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {i.result}
                    </span>
                  )}
                  <button onClick={() => handleCancel(i._id)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={20} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- FEEDBACK MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-8 ${decisionType === 'passed' ? 'bg-emerald-500' : 'bg-rose-500'} text-white flex justify-between items-center`}>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Final Decision</h3>
                <p className="text-white/80 font-bold text-sm">Candidate: {selectedInterview?.userId?.fullName || selectedInterview?.userId?.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <MessageSquare size={14}/> Feedback & Reasoning
                </label>
                <textarea 
                  rows={5}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={`Explain why the candidate ${decisionType}...`}
                  className="w-full p-5 bg-slate-50 border-none rounded-[2rem] text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 transition-all resize-none shadow-inner"
                />
                <div className="flex items-center gap-2 mt-2 text-blue-600 bg-blue-50 p-3 rounded-xl">
                  <Info size={14} className="shrink-0" />
                  <p className="text-[10px] font-bold leading-tight">
                    This note is shared with the applicant immediately. Be professional and constructive.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleFinalDecision}
                disabled={!feedbackText.trim()}
                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${decisionType === 'passed' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'}`}
              >
                <Send size={18} /> Confirm {decisionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}