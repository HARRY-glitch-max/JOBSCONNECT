import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  scheduleInterview,
  getEmployerInterviews,
  cancelInterview,
  getEmployerApplications,
  getEmployerJobs,
} from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import StatusBadge from "../components/applications/StatusBadge";

export default function Interviews() {
  const { user } = useContext(AuthContext);

  // --- State Management ---
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]); 
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ jobId: "", candidateId: "", date: "", time: "", location: "" });

  // --- 1. RESOLVE STABLE IDENTITY ---
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
      setError(err.response?.data?.message || "Failed to load management data");
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, employerId, fetchData]);

  const filteredCandidates = applications.filter(app => {
    const appId = app.jobId?._id || app.jobId; 
    return String(appId) === String(form.jobId);
  });

  // --- Action: Schedule (FIXED PAYLOAD) ---
  const handleSchedule = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.jobId || !form.candidateId || !form.date || !form.time) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      // Logic: Send keys that match your Backend Schema (userId and employerId)
      await scheduleInterview(form.jobId, {
        userId: form.candidateId, // Matches backend 'userId' requirement
        employerId: employerId,    // Matches backend 'employerId' requirement
        date: form.date,
        time: form.time,
        location: form.location || "Online/TBD",
      });

      alert("Interview scheduled successfully!");
      setForm({ jobId: "", candidateId: "", date: "", time: "", location: "" });
      fetchData();
    } catch (err) {
      console.error("Schedule Error:", err.response?.data);
      setError(err.response?.data?.message || "Failed to schedule interview");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this interview?")) return;
    try {
      await cancelInterview(id);
      setInterviews(prev => prev.map(i => i?._id === id ? { ...i, status: "cancelled" } : i));
    } catch (err) {
      setError("Failed to cancel interview");
    }
  };

  if (loading) return (
    <div className="p-10 text-center text-gray-500">
      <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
      <p>Syncing Schedule...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Interview Management</h2>
        <p className="text-gray-600">Schedule and track candidate sessions</p>
      </header>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 shadow-sm">
          <p className="font-bold text-sm uppercase tracking-wider">Schedule Error</p>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* --- Scheduling Form --- */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
        <h3 className="text-lg font-semibold mb-5 text-gray-700 tracking-tight">Schedule New Session</h3>
        <form onSubmit={handleSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Target Job Posting</label>
            <select
              value={form.jobId}
              onChange={(e) => setForm({ ...form, jobId: e.target.value, candidateId: "" })}
              className="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            >
              <option value="">Select a Posting</option>
              {jobs.map(job => job && (
                <option key={job._id} value={job._id}>{job.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Candidate (Shortlisted)</label>
            <select
              value={form.candidateId}
              onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
              className="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 transition-all"
              disabled={!form.jobId}
              required
            >
              <option value="">{form.jobId ? "Choose Candidate" : "Choose Job First"}</option>
              {filteredCandidates.map(app => (
                <option key={app.userId?._id} value={app.userId?._id}>
                  {app.userId?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Location / Meeting Link</label>
            <input
              type="text"
              placeholder="e.g. Kencom, Zoom Link, or Office Room 202"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="border border-gray-300 p-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98]">
            Confirm & Notify Candidate
          </button>
        </form>
      </section>

      {/* --- Interview List --- */}
      <section>
        <h3 className="text-xl font-bold mb-5 text-gray-800 tracking-tight">Current Schedule</h3>
        {interviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium italic">No active interviews found for this account.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map(i => {
              if (!i) return null;
              return (
                <div key={i._id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-blue-900">{i.jobId?.title || i.jobTitle || "Job Interview"}</h4>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-400">Candidate:</span> {i.userId?.name || i.candidateName || "User"}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 font-medium">
                      <span className="flex items-center gap-1">📅 {i.date ? new Date(i.date).toLocaleDateString() : "TBD"}</span>
                      <span className="flex items-center gap-1">⏰ {i.time || "TBD"}</span>
                      <span className="truncate max-w-[200px] flex items-center gap-1">📍 {i.location || "TBD"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge status={i.status || "scheduled"} />
                    {i.status === "scheduled" && (
                      <button
                        onClick={() => handleCancel(i._id)}
                        className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-white border border-red-100 px-4 py-2 rounded-lg hover:bg-red-500 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}