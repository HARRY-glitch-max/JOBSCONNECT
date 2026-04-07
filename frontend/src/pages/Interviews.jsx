import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  scheduleInterview,
  getEmployerInterviews,
  cancelInterview,
  getEmployerApplications,
  getEmployerJobs,
} from "../services/api";
import { updateInterviewStatus } from "../api/interviews"; // ✅ Added API import
import { AuthContext } from "../contexts/AuthContext";
import StatusBadge from "../components/applications/StatusBadge";

export default function Interviews() {
  const { user } = useContext(AuthContext);

  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]); 
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ jobId: "", candidateId: "", date: "", time: "", location: "" });

  const employerId = user?.employerId || user?._id;

  const fetchData = useCallback(async () => {
    if (!employerId) return;
    try {
      setLoading(true);
      setError("");
      const [interviewsRes, appsRes, jobsRes] = await Promise.all([
        getEmployerInterviews(employerId),
        getEmployerApplications(employerId),
        getEmployerJobs(employerId),
      ]);

      setInterviews(interviewsRes.data || []);
      setJobs(jobsRes.data || []);
      const shortlisted = (appsRes.data || []).filter(app => app.status === "shortlisted");
      setApplications(shortlisted);
    } catch (err) {
      console.error("❌ Data fetch error:", err);
      setError("Failed to load management data");
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, employerId, fetchData]);

  // --- New: Handle Pass/Fail Decision ---
  const handleDecision = async (id, decision) => {
    try {
      await updateInterviewStatus(id, decision);
      // Refresh data to update badges and hide buttons
      fetchData();
      alert(`Candidate marked as ${decision}`);
    } catch (err) {
      console.error("Update failed", err);
      setError("Could not update candidate status.");
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.jobId || !form.candidateId || !form.date || !form.time) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      await scheduleInterview(form.jobId, {
        userId: form.candidateId,
        employerId: employerId,
        date: form.date,
        time: form.time,
        location: form.location || "Online/TBD",
      });
      alert("Interview scheduled!");
      setForm({ jobId: "", candidateId: "", date: "", time: "", location: "" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this interview?")) return;
    try {
      await cancelInterview(id);
      fetchData();
    } catch (err) {
      setError("Failed to cancel");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Syncing Schedule...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Interview Management</h2>
        <p className="text-slate-500 font-medium">Schedule and track candidate sessions</p>
      </header>

      {/* --- Scheduling Form --- */}
      <section className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100">
        <h3 className="text-lg font-black mb-6 text-slate-800">Schedule New Session</h3>
        <form onSubmit={handleSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value, candidateId: "" })} className="p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Select a Posting</option>
            {jobs.map(job => job && <option key={job._id} value={job._id}>{job.title}</option>)}
          </select>
          <select value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })} className="p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" disabled={!form.jobId} required>
            <option value="">Choose Candidate</option>
            {applications.filter(app => String(app.jobId?._id || app.jobId) === String(form.jobId)).map(app => (
              <option key={app.userId?._id} value={app.userId?._id}>{app.userId?.fullName || app.userId?.name}</option>
            ))}
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" required />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" required />
          <input type="text" placeholder="Location or Meeting Link" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="md:col-span-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
          <button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95">Confirm & Notify Candidate</button>
        </form>
      </section>

      {/* --- Interview List --- */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 tracking-tighter">Current Schedule</h3>
        {interviews.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">No active interviews found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map(i => (
              <div key={i._id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                <div>
                  <h4 className="font-black text-xl text-slate-900">{i.jobId?.title || "Position TBD"}</h4>
                  <p className="text-slate-500 font-bold">Candidate: <span className="text-blue-600">{i.userId?.fullName || i.userId?.name}</span></p>
                  <div className="flex gap-4 mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>📅 {new Date(i.date).toLocaleDateString()}</span>
                    <span>⏰ {i.time}</span>
                    <span className="truncate max-w-xs">📍 {i.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    i.result === 'passed' ? 'bg-emerald-100 text-emerald-600' :
                    i.result === 'failed' ? 'bg-rose-100 text-rose-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {i.result === 'pending' ? i.status : i.result}
                  </span>

                  {/* ✅ THE PASS/FAIL BUTTONS */}
                  {i.result === "pending" && i.status === "scheduled" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleDecision(i._id, 'passed')} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">Pass</button>
                      <button onClick={() => handleDecision(i._id, 'failed')} className="px-6 py-2 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-black uppercase border border-rose-100 rounded-xl transition-all active:scale-95">Fail</button>
                    </div>
                  )}

                  <button onClick={() => handleCancel(i._id)} className="px-4 py-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 text-[10px] font-black uppercase rounded-xl transition-all">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}