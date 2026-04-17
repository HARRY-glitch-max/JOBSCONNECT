import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { 
  FileText, MessageSquare, User, Briefcase, Loader2,
  CheckCircle2, XCircle, X, RefreshCw, Code, Sparkles,
  ExternalLink, MousePointer2, Calendar, UserCheck, UserX
} from "lucide-react";
import { getEmployerApplications, updateApplicationStatus } from "../api/applications";
import StatusBadge from "../components/applications/StatusBadge";
import { toast } from "react-hot-toast";

const EmployerApplications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchApps = useCallback(async () => {
    const eId = user?.employerId || user?._id;
    if (!eId) {
      setError("Employer identity not verified. Please check login status.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getEmployerApplications(eId);
      setApps(data || []);
      setCount((data || []).length);
    } catch (err) {
      setError("Failed to synchronize application data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleReview = async (appId, newStatus) => {
    try {
      const response = await updateApplicationStatus(appId, newStatus);
      setApps((prev) =>
        prev.map((app) => 
          app._id === appId ? { ...app, status: response?.status || newStatus } : app
        )
      );
      toast.success(`Workflow: ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error(`Workflow update failed.`);
    }
  };

  const handleMessage = (app) => {
    const candidateId = app.userId?._id || app.userId?.id;
    const candidateName = app.userId?.name || "Candidate";
    if (!candidateId) return toast.error("Candidate identity missing.");
    navigate(`/employer/dashboard/messages/${candidateId}`, {
      state: { receiverName: candidateName, receiverId: candidateId },
    });
  };

  const renderSkills = (skillsData, limit = 3) => {
    let skillsArray = Array.isArray(skillsData) ? skillsData : 
                     (typeof skillsData === "string" ? skillsData.split(",").map(s => s.trim()) : []);
    
    if (skillsArray.length === 0) return <span className="text-slate-400 text-[9px] italic font-medium">No skills.</span>;
    
    const displayArray = skillsArray.slice(0, limit);

    return (
      <div className="flex flex-wrap gap-1">
        {displayArray.map((skill, i) => (
          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[8px] font-black uppercase tracking-wider">
            {skill}
          </span>
        ))}
        {skillsArray.length > limit && (
          <span className="text-[8px] text-slate-400 font-bold ml-1">+{skillsArray.length - limit}</span>
        )}
      </div>
    );
  };

  const renderActionButtons = (app) => {
    const status = app.status?.toLowerCase();

    if (status === "submitted" || !status) {
      return (
        <div className="flex items-center gap-1">
          <button onClick={() => handleReview(app._id, "shortlisted")} className="p-2 text-slate-300 hover:text-emerald-500 transition-all" title="Shortlist Candidate"><CheckCircle2 size={22}/></button>
          <button onClick={() => handleReview(app._id, "rejected")} className="p-2 text-slate-300 hover:text-rose-500 transition-all" title="Reject Application"><XCircle size={22}/></button>
        </div>
      );
    }

    if (status === "shortlisted") {
      return (
        <button onClick={() => handleReview(app._id, "interview")} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all border border-amber-100">
          <Calendar size={14} /> Schedule Interview
        </button>
      );
    }

    if (status === "interview") {
      return (
        <div className="flex items-center gap-2">
          <button onClick={() => handleReview(app._id, "hired")} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-600 hover:text-white transition-all"><UserCheck size={14} /> Hire</button>
          <button onClick={() => handleReview(app._id, "unsuccessful")} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[9px] uppercase hover:bg-rose-600 hover:text-white transition-all"><UserX size={14} /> Unsuccessful</button>
        </div>
      );
    }

    return <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Stage Finalized</span>;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Updating Pipeline...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Applicant Tracking</h1>
          <p className="text-slate-500 font-medium">Review candidate credentials and manage recruitment workflow.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchApps} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 shadow-sm transition-all active:scale-95">
            <RefreshCw size={20} />
          </button>
          <div className="bg-blue-600 px-8 py-4 rounded-3xl shadow-xl shadow-blue-200 flex items-center gap-4 text-white">
            <span className="font-black text-3xl">{count}</span>
            <div className="h-8 w-[1px] bg-blue-400/50"></div>
            <span className="font-bold text-xs uppercase tracking-widest leading-tight">Total<br/>Applicants</span>
          </div>
        </div>
      </header>

      {apps.length > 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position & Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credentials Snippet</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {apps.map((app) => (
                <tr key={app._id} className="hover:bg-blue-50/10 transition-all group">
                  <td className="px-8 py-6 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={12} /> {app.jobId?.title || "Product Designer"}
                      </span>
                      <span className="font-black text-slate-900 text-base uppercase">{app.userId?.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{app.userId?.email}</span>
                    </div>
                  </td>

                  {/* CLICKABLE CREDENTIALS BLOCK */}
                  <td className="px-8 py-6 max-w-md">
                    <div 
                      onClick={() => setSelectedCandidate({ 
                        ...app.userId, 
                        displayBio: app.bio || app.userId?.bio, 
                        displaySkills: app.skills || app.userId?.skills, 
                        fullAppData: app 
                      })}
                      className="cursor-pointer group/card bg-white border border-slate-200 rounded-[1.5rem] p-5 space-y-4 hover:border-blue-400 hover:shadow-lg transition-all"
                    >
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={12} className="text-blue-500" /> Pitch / Bio
                        </h4>
                        <p className="text-[11px] text-slate-600 italic line-clamp-2 leading-relaxed">
                          "{app.bio || app.userId?.bio || "No professional statement available."}"
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
                        <div className="flex-1">
                           <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Core Skills</h4>
                           {renderSkills(app.skills || app.userId?.skills, 3)}
                        </div>
                        
                        {app.resume && (
                          <a 
                            href={app.resume} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()} // Prevents modal from opening when clicking CV
                            className="flex flex-col items-center gap-1 p-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-200"
                          >
                            <FileText size={14} /> CV
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-end text-[8px] font-black text-blue-600 uppercase tracking-widest group-hover/card:translate-x-1 transition-transform">
                        See Full Profile <MousePointer2 size={10} className="ml-1" />
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6 align-top">
                    <StatusBadge status={app.status} />
                  </td>

                  <td className="px-8 py-6 align-top">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center gap-2">
                         {renderActionButtons(app)}
                      </div>
                      
                      <button 
                        onClick={() => handleMessage(app)} 
                        className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-blue-100"
                      >
                        <MessageSquare size={14}/> Open Chat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
           <User size={48} className="mx-auto mb-4 text-slate-200" />
           <h3 className="text-2xl font-black text-slate-900 uppercase">No Active Candidates</h3>
        </div>
      )}

      {/* MODAL - ENHANCED FOR THE DETAILED VIEW */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black uppercase shadow-2xl shadow-blue-200">
                  {selectedCandidate.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-900 leading-tight">{selectedCandidate.name}</h2>
                  <p className="text-blue-600 font-bold text-sm uppercase tracking-[0.2em]">{selectedCandidate.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="p-4 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-500" /> Detailed Pitch
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed italic">"{selectedCandidate.displayBio || "No statement provided."}"</p>
                </div>

                {selectedCandidate.fullAppData?.resume && (
                  <div className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Official Document</span>
                    </div>
                    <a href={selectedCandidate.fullAppData.resume} target="_blank" rel="noreferrer" className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-colors">Download CV</a>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Code size={14} className="text-blue-500" /> Technical Arsenal
                </h4>
                <div className="flex flex-wrap gap-2">
                  {renderSkills(selectedCandidate.displaySkills, null)}
                </div>
              </div>
            </div>

            <button 
              onClick={() => { handleMessage(selectedCandidate.fullAppData); setSelectedCandidate(null); }}
              className="w-full mt-10 py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-4"
            >
              <MessageSquare size={20} /> Initiate Recruitment Dialogue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerApplications;