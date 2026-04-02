import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "axios";

const JobCard = ({ job }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [hasApplied, setHasApplied] = useState(false);
  const [checking, setChecking] = useState(false);

  const {
    _id,
    title = "Job Title",
    company = "Company Name",
    employerId,
    location = "Remote / On-site",
    type = "Full-time",
    salary = "Competitive",
    createdAt,
    category = "General" // Fallback if you have a category field
  } = job;

  // Check if the current user has already applied
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?._id || user.role !== "jobseeker") return;
      
      setChecking(true);
      try {
        const { data } = await axios.get(
          `/api/applications/check/${user._id}/${_id}`
        );
        setHasApplied(data.applied);
      } catch (err) {
        console.error("❌ Error checking application status", err);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [user?._id, _id, user?.role]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const options = { month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleMessageRedirect = () => {
    if (!employerId) {
      alert("Employer contact information is missing for this job.");
      return;
    }
    // Redirects to messages with query params for the Deep Linking logic in Messages.jsx
    navigate(`/messages?target=${employerId}&name=${encodeURIComponent(company)}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          {/* Company Avatar Fallback */}
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100 shrink-0">
            {company.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {title}
            </h3>
            <p className="text-slate-500 font-medium truncate">{company}</p>
          </div>
        </div>
        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
          {type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-3 mt-6 border-t border-slate-50 pt-4">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <MapPin size={16} className="text-slate-400" /> 
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <DollarSign size={16} className="text-slate-400" /> 
          <span className="truncate">{salary}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Briefcase size={16} className="text-slate-400" /> 
          <span className="truncate">{category}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Clock size={16} className="text-slate-400" /> 
          <span>{formatDate(createdAt)}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          to={`/jobs/${_id}`}
          className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
        >
          View Details <ChevronRight size={16} />
        </Link>

        {/* CONDITIONAL ACTION BUTTON */}
        {checking ? (
          <div className="animate-pulse bg-slate-100 h-9 w-32 rounded-xl" />
        ) : hasApplied ? (
          <button
            onClick={handleMessageRedirect}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm active:scale-95"
          >
            <MessageSquare size={16} />
            Message Employer
          </button>
        ) : (
          <Link
            to={`/apply/${_id}`}
            className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm active:scale-95"
          >
            Apply Now
          </Link>
        )}
      </div>
    </div>
  );
};

export default JobCard;