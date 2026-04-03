import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Search,
  User
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        // Ensure your backend is actually returning populated jobseeker info
        const res = await api.get('/applications');
        setApps(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Failed to fetch applications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  // Filter candidates locally for better UX
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const name = app.jobseekerId?.name?.toLowerCase() || "";
      const title = (app.jobTitle || app.jobId?.title || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || title.includes(searchTerm.toLowerCase());
    });
  }, [apps, searchTerm]);

  const handleOpenChat = (jobseeker) => {
    // 🛡️ Safety Check: Extract the ID whether jobseeker is an object or just an ID string
    const targetId = jobseeker?._id || jobseeker;
    const targetName = jobseeker?.name || "Candidate";

    if (!targetId || typeof targetId !== 'string') {
      console.error("❌ Invalid Jobseeker ID for chat:", jobseeker);
      return;
    }
    
    // Consistent routing with your ChatPage.jsx
    navigate(`/employer/dashboard/chat/${targetId}?name=${encodeURIComponent(targetName)}`, {
      state: { receiverName: targetName, avatar: jobseeker?.avatar }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Applications...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Talent Pool</h1>
          <p className="text-slate-400 text-sm font-medium">
            You have <span className="text-blue-400">{apps.length} total</span> applications this month.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search candidate or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button className="bg-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap">
            Post New Job
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 font-black">Target Position</th>
                <th className="px-8 py-5 font-black">Candidate Info</th>
                <th className="px-8 py-5 font-black">Documents</th>
                <th className="px-8 py-5 font-black text-center">Status</th>
                <th className="px-8 py-5 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <tr key={app._id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* Position */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <span className="font-bold text-slate-900">{app.jobTitle || app.jobId?.title || "N/A"}</span>
                      </div>
                    </td>

                    {/* Candidate */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                          {app.jobseekerId?.avatar ? (
                            <img src={app.jobseekerId.avatar} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase text-xs tracking-tight">
                            {app.jobseekerId?.name || "Anonymous User"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold lowercase">
                            {app.jobseekerId?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Documents */}
                    <td className="px-8 py-6">
                      <button className="group/btn flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
                        <FileText size={14} className="group-hover/btn:rotate-12 transition-transform" />
                        View CV
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        app.status === 'Rejected' ? 'bg-red-50 text-red-500' : 
                        app.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {app.status || 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button title="Shortlist" className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                          <CheckCircle2 size={20} />
                        </button>
                        <button title="Reject" className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                          <XCircle size={20} />
                        </button>
                        
                        <div className="w-[1px] h-6 bg-slate-100 mx-1"></div>

                        {/* MESSAGE BUTTON - Linked to ChatPage */}
                        <button 
                          onClick={() => handleOpenChat(app.jobseekerId)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
                        >
                          <MessageSquare size={16} fill="white" className="opacity-40" />
                          Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium">
                    No applications found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}