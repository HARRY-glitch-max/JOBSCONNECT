import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  Plus
} from "lucide-react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

const ApplyJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [file, setFile] = useState(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const { data } = await axios.get(`/api/jobs/${jobId}`);
        setJob(data);
      } catch (err) {
        setStatus({ type: "error", message: "Could not fetch job details." });
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId]);

  // Handle Skills Tagging
  const addSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) return setStatus({ type: "error", message: "Please upload your resume." });
    if (!bio) return setStatus({ type: "error", message: "A short bio is required for the employer." });
    if (skills.length === 0) return setStatus({ type: "error", message: "Please add at least one relevant skill." });

    setSubmitting(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("bio", bio);
    formData.append("jobId", jobId);
    formData.append("userId", user?._id);
    formData.append("coverLetter", coverLetter);
    
    // Send skills as an array (handled by your updated controller)
    skills.forEach(skill => formData.append("skills", skill));

    try {
      await axios.post("/api/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setStatus({ type: "success", message: "Application submitted successfully!" });
      setTimeout(() => navigate("/jobseeker/dashboard"), 2000);
    } catch (err) {
      console.error("Submission Error:", err.response?.data);
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Submission failed. Please check all fields." 
      });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-slate-500 font-medium tracking-tight italic">Initializing application portal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all mb-8 font-bold text-sm uppercase tracking-wider group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Listings
        </button>

        <div className="bg-white border border-slate-200 rounded-[40px] shadow-2xl shadow-blue-900/5 overflow-hidden">
          <div className="p-10 md:p-16">
            <header className="mb-12">
              <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                Join the Team
              </span>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                {job?.title || "Position Details"}
              </h1>
              <p className="text-slate-500 text-lg font-medium">
                Applying to <span className="text-blue-600 font-black uppercase">{job?.employerId?.companyName || "Organization"}</span>
              </p>
            </header>

            {status.message && (
              <div className={`mb-10 p-6 rounded-3xl flex items-center gap-4 font-bold text-sm border animate-in fade-in slide-in-from-top-4 duration-300 ${
                status.type === "success" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                : "bg-red-50 text-red-600 border-red-100"
              }`}>
                {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* ✅ NEW: BIO SECTION */}
              <div>
                <label className="block text-slate-900 font-black text-xs uppercase tracking-[0.2em] mb-4">
                  Professional Pitch / Bio <span className="text-red-500">*</span>
                </label>
                <textarea 
                  rows="3"
                  placeholder="In 2-3 sentences, tell the employer why you're a great fit..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-6 text-slate-700 font-semibold focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                ></textarea>
              </div>

              {/* ✅ NEW: SKILLS TAG SYSTEM */}
              <div>
                <label className="block text-slate-900 font-black text-xs uppercase tracking-[0.2em] mb-4">
                  Relevant Skills <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((skill, index) => (
                    <span key={index} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold animate-in zoom-in duration-200">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}><X size={14} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill(e)}
                    placeholder="e.g. React, Node.js, UI Design"
                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-3 text-sm font-semibold outline-none focus:border-blue-500 transition-all"
                  />
                  <button 
                    type="button"
                    onClick={addSkill}
                    className="bg-slate-100 text-slate-600 p-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-slate-900 font-black text-xs uppercase tracking-[0.2em] mb-5">
                  Resume / CV <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center transition-all ${file ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 group-hover:border-blue-400"}`}>
                    <UploadCloud size={32} className={file ? "text-emerald-600" : "text-slate-400"} />
                    <p className="text-slate-900 font-black text-lg mt-4">{file ? file.name : "Upload your CV"}</p>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">PDF/DOCX (Max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-slate-900 font-black text-xs uppercase tracking-[0.2em] mb-4">
                  Additional Details (Optional)
                </label>
                <textarea 
                  rows="4"
                  placeholder="Any other information you'd like to share..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-6 text-slate-700 font-semibold focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-2xl disabled:bg-slate-300"
              >
                {submitting ? <Loader2 className="animate-spin" size={28} /> : <>Submit Application <FileText size={24} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyJob;