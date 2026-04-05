import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { 
  FileText, MessageSquare, User, Briefcase, Loader2,
  AlertCircle, CheckCircle2, XCircle, Calendar, X, ExternalLink
} from "lucide-react";
import { getEmployerApplications, updateApplicationStatus } from "../api/applications";
import StatusBadge from "../components/applications/StatusBadge";

const EmployerApplications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  
  // State for the Bio/Skills Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchApps = async () => {
    if (!user?.employerId) {
      setError("Employer identity not verified. Please log in as an employer.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getEmployerApplications(user.employerId);
      setApps(data || []);
      setCount((data || []).length);
    } catch (err) {
      setError("Failed to synchronize application data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employerId) fetchApps();
  }, [user?.employerId]);

  const handleReview = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      setApps((prev) =>
        prev.map((app) => app._id === appId ? { ...app, status: newStatus } : app)
      );
    } catch (err) {
      alert(`Failed to update status to ${newStatus}.`);
    }
  };

  const handleMessage = (app) => {
    if (!app?.userId?._id) return;
    navigate(`/employer/dashboard/chat/${app.userId._id}`, {
      state: { receiverName: app.userId.name, jobTitle: app.jobId?.title },
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing Talent Pipeline...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Talent Pipeline</h1>
          <p className="text-slate-500 font-medium max-w-md">Manage your incoming applications and shortlist top talent.</p>
        </div>
        <div className="bg-blue-600 px-8 py-4 rounded-3xl shadow-xl shadow-blue-200 flex items-center gap-4 text-white">
          <span className="font-black text-3xl">{count}</span>
          <div className="h-8 w-[1px] bg-blue-400/50"></div>
          <span className="font-bold text-xs uppercase tracking-widest leading-none">Total<br/>Applicants</span>
        </div>
      </header>

      {error ? (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-600 font-bold">
          <AlertCircle size={20} /> {error}
        </div>
      ) : apps.length > 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Position</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Documents</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.map((app) => (
                  <tr key={app._id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-2xl text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                          <Briefcase size={20} />
                        </div>
                        <span className="font-extrabold text-slate-900">{app.jobId?.title || "General Role"}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div 
                        className="flex flex-col gap-1 cursor-pointer group/name" 
                        onClick={() => setSelectedCandidate({ ...app.userId, appBio: app.bio, appSkills: app.skills })}
                      >
                        <span className="font-black text-slate-900 text-sm group-hover/name:text-blue-600 flex items-center gap-1.5 transition-colors">
                          {app.userId?.name || "Anonymous"} 
                          <ExternalLink size={12} className="opacity-0 group-hover/name:opacity-100 text-blue-600" />
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{app.userId?.email}</span>
                        
                        {/* QUICK SKILLS PREVIEW */}
                        <div className="flex gap-1 flex-wrap mt-1">
                          {(app.userId?.skills || app.skills || []).slice(0, 2).map((s, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md uppercase font-black group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      {app.resume ? (
                        <a href={app.resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-black text-[11px] uppercase tracking-wider hover:underline">
                          <FileText size={16} strokeWidth={2.5} /> View Portfolio/CV
                        </a>
                      ) : <span className="text-slate-300 italic text-xs">Not Provided</span>}
                    </td>

                    <td className="px-8 py-6">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleReview(app._id, "shortlisted")} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Shortlist Candidate">
                          <CheckCircle2 size={22} />
                        </button>
                        <button onClick={() => handleReview(app._id, "rejected")} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Reject Candidate">
                          <XCircle size={22} />
                        </button>
                        <div className="w-[1px] h-6 bg-slate-100 mx-1"></div>
                        <button onClick={() => handleReview(app._id, "interview")} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm">
                          Schedule
                        </button>
                        <button onClick={() => handleMessage(app)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Message Candidate">
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200"><User size={48} /></div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">The pipeline is quiet...</h3>
        </div>
      )}

      {/* --- QUICK VIEW MODAL --- */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCandidate.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">Jobseeker</span>
                  <span className="text-slate-400 font-bold text-xs">{selectedCandidate.email}</span>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={12} className="text-blue-600" /> Professional Bio
                </h4>
                <p className="text-slate-600 text-[15px] leading-relaxed font-medium italic bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  "{selectedCandidate.bio || selectedCandidate.appBio || 'Candidate has not provided a bio yet.'}"
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-blue-600" /> Technical Skills
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {(selectedCandidate.skills?.length > 0 ? selectedCandidate.skills : (selectedCandidate.appSkills || [])).length > 0 ? (
                    (selectedCandidate.skills?.length > 0 ? selectedCandidate.skills : selectedCandidate.appSkills).map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-extrabold rounded-xl border border-blue-100 shadow-sm">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-sm">No skills listed.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerApplications;