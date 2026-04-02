import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyApplications } from '../api/applications';
import { FileText, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const MyApplications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        if (!user?._id) return;
        const data = await getMyApplications(user._id);
        setApps(data);
      } catch (err) {
        console.error("Error fetching applications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [user?._id]);

  // ✅ HANDLER UPDATED FOR SYNC WITH MESSAGES PAGE
  const handleMessageClick = (e, app) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Extract Employer Data
    // jobId.employerId usually contains the employer's User ID or Profile
    const employerData = app.jobId?.employerId;
    
    // We need the ID of the employer (the person we are messaging)
    const targetId = typeof employerData === 'object' ? employerData?._id : employerData;
    const companyName = employerData?.companyName || "Employer";

    if (targetId && targetId !== "undefined") {
      /**
       * 2. ✅ UPDATED NAVIGATION
       * We use the 'target' query parameter to match the logic in your Messages.jsx
       * Also passing 'name' so the inbox can show a temporary entry if no history exists.
       */
      navigate(`/jobseeker/dashboard/messages?target=${targetId}&name=${encodeURIComponent(companyName)}`);
    } else {
      console.error("Missing ID details:", { employerData, targetId });
      alert("Employer information is currently unavailable. Please try again later.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: "bg-blue-100 text-blue-700 border-blue-200",
      reviewing: "bg-yellow-100 text-yellow-700 border-yellow-200",
      shortlisted: "bg-purple-100 text-purple-700 border-purple-200",
      interview: "bg-cyan-100 text-cyan-700 border-cyan-200",
      hired: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status?.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-slate-500 font-medium">Syncing your applications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Applications</h1>
        <div className="bg-slate-100 px-4 py-1 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
          {apps.length} Total
        </div>
      </div>

      {apps.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Job Title</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Resume</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.map((app) => (
                  <tr key={app._id} className="group hover:bg-blue-50/30 transition-all duration-200">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {app.jobId?.title || "Position Removed"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-2">
                        <span className="text-slate-900 font-bold">{app.jobId?.employerId?.companyName || "Employer"}</span>
                        <span className="text-slate-300">•</span>
                        <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <a 
                        href={app.resume} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors"
                      >
                        <FileText size={16} /> View
                      </a>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        type="button"
                        onClick={(e) => handleMessageClick(e, app)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-blue-200 hover:shadow-none"
                      >
                        <MessageSquare size={14} />
                        Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-slate-300" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No applications yet</h3>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">You haven't submitted any applications. Start your career journey today!</p>
          <button 
            onClick={() => navigate('/jobs')} 
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-blue-100"
          >
            Find a Job
          </button>
        </div>
      )}
    </div>
  );
};

export default MyApplications;