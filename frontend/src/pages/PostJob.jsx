// src/pages/PostJob.jsx
import { useState, useContext, useEffect } from "react";
import { createJob } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

export default function PostJob() {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary: "",
    deadline: "", // 🕒 NEW: Deadline state
    employerId: user?._id || user?.employerId || "", 
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync employerId if the user context loads late
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, employerId: user._id || user.employerId }));
    }
  }, [user]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Basic validation for deadline
    if (new Date(formData.deadline) <= new Date()) {
      setError("Deadline must be a future date and time.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        requirements: formData.requirements
          .split(",")
          .map((req) => req.trim())
          .filter((req) => req !== ""), 
      };

      await createJob(payload);
      setSuccess("Job posted successfully! Jobseekers have been notified.");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        requirements: "",
        location: "",
        salary: "",
        deadline: "",
        employerId: user?._id || user?.employerId || "",
      });
    } catch (err) {
      console.error("Job post failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to post job. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 mb-20 bg-white shadow-xl p-8 rounded-xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-blue-600">Post a New Opening</h2>
        <p className="text-slate-500 mt-2">Fill in the details to find your next great hire.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Senior Software Engineer"
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Job Description</label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the role and responsibilities..."
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Requirements</label>
          <textarea
            name="requirements"
            rows="2"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="React, Node.js, 3+ years experience (comma separated)"
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Nairobi, Kenya (or Remote)"
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Salary Range</label>
            <input
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g. KES 150k - 200k"
              className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* 🕒 Deadline Field */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label className="block text-sm font-bold text-blue-700 mb-1">Application Deadline</label>
          <input
            type="datetime-local"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full border border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900"
            required
          />
          <p className="text-xs text-blue-600 mt-2 font-medium italic">
            * Once this date passes, the job will be automatically hidden from jobseekers.
          </p>
        </div>

        <input type="hidden" name="employerId" value={formData.employerId} />

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-lg ${
            isSubmitting 
              ? "bg-slate-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
          }`}
        >
          {isSubmitting ? "Posting Job..." : "Confirm & Post Job"}
        </button>
      </form>
    </div>
  );
}