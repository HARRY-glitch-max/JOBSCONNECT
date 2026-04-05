import React from "react";
import { 
  MapPin, 
  CircleDollarSign, 
  Layers, 
  Users, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const JobCard = ({ job }) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-white border-2 border-slate-100 rounded-[3rem] overflow-hidden hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 h-full flex flex-col">
      
      {/* 1. BRAND & HEADER SECTION */}
      <div className="p-8 pb-4 flex justify-between items-start bg-slate-50/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
            <Globe size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 leading-tight">
              {job.employerId?.companyName || job.company || "HireFlow Partner"}
            </h4>
            <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={12} /> Verified Employer
            </span>
          </div>
        </div>
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-right">Job Type</p>
          <p className="text-xs font-bold text-slate-900 text-right">{job.jobType || "Full-Time"}</p>
        </div>
      </div>

      {/* 2. CORE INFORMATION GRID (The "Meat") */}
      <div className="p-8 pt-4 flex-1">
        <h3 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-6 group-hover:text-blue-600 transition-colors">
          {job.title}
        </h3>

        {/* Visibility Feature: The Data Matrix */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <CircleDollarSign className="text-blue-600" size={20} />
            <div>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Annual Salary</p>
              <p className="text-sm font-black text-slate-900">{job.salary ? `$${(job.salary / 1000).toFixed(0)}k+` : "Negotiable"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <MapPin className="text-slate-400" size={20} />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
              <p className="text-sm font-bold text-slate-900 truncate">{job.location || "Remote"}</p>
            </div>
          </div>
        </div>

        {/* 3. FULL DESCRIPTION AREA (Visible, Not Clamped) */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <Layers size={14} /> Mission & Responsibilities
          </div>
          <p className="text-slate-600 text-base leading-relaxed font-medium bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
            {job.description}
          </p>
        </div>

        {/* 4. TECH STACK & TEAM COLLABORATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <Cpu size={14} /> Core Tech Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {(job.skills || ["React", "Node.js", "MongoDB", "AWS"]).map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <Users size={14} /> Team Environment
            </div>
            <p className="text-[11px] text-slate-500 font-bold leading-tight">
              Collaborate directly with Product Managers and UI/UX Designers to scale core systems.
            </p>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE FOOTER */}
      <div className="p-6 bg-slate-900 mt-auto">
        <button 
          onClick={() => navigate(`/apply/${job._id}`)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all group-hover:shadow-lg group-hover:shadow-blue-500/20"
        >
          Begin Application Process <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default JobCard;