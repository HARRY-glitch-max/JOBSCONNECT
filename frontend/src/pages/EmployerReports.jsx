import React, { useState, useEffect } from "react";
import { 
  FileText, Users, Calendar, TrendingUp, 
  ArrowUpRight, Clock, CheckCircle, Download, 
  Loader2, FileDown, AlertCircle, RefreshCw
} from "lucide-react";
import apiClient from "../api/client";

export default function EmployerReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      // ✅ Updated to hit the correct endpoint
      const { data } = await apiClient.get("/employers/reports");
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid response format");
      }
      
      setReportData(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.response?.data?.message || "No analytics reports found. Please wait for an Admin sync.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  };

  // ✅ PDF Download Handler - Using correct endpoint
  const handleDownloadPDF = async () => {
    setDownloading(true);
    setDownloadError(null);
    
    try {
      // The interceptor already adds the token, no need to manually add it
      const response = await apiClient.get("/employers/reports/download", {
        responseType: "blob"
      });
      
      // Check if response is a PDF (not an error HTML)
      if (response.data.type === 'application/json') {
        // Try to parse as JSON to get error message
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || "Failed to generate report");
      }
      
      // Create blob link to download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JobConnect_Hiring_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download error:", err);
      setDownloadError(err.message || "Failed to download report. Please try again.");
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">
          Syncing Analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-3xl m-8">
        <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
        <p className="text-rose-500 font-semibold mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // ✅ Destructure metrics with safe fallbacks
  const { 
    jobs = { total: 0, active: 0, closed: 0 },
    applications = { total: 0, shortlisted: 0, hired: 0, rejected: 0, pending: 0 },
    interviews = { total: 0, completed: 0, scheduled: 0, cancelled: 0 }
  } = reportData || {};

  // Calculate derived metrics
  const applicationsPerJob = jobs.total > 0 ? (applications.total / jobs.total).toFixed(1) : 0;
  const interviewRate = applications.total > 0 ? Math.round((interviews.total / applications.total) * 100) : 0;
  const successRate = interviews.total > 0 ? Math.round((interviews.completed / interviews.total) * 100) : 0;
  const conversionRate = applications.total > 0 ? Math.round((applications.hired / applications.total) * 100) : 0;
  const shortlistRate = applications.total > 0 ? Math.round((applications.shortlisted / applications.total) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Performance Insights</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hiring Analytics</h2>
          <p className="text-slate-500 mt-2 font-medium">
            Real-time hiring metrics and analytics dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown size={18} />
                Download Report (PDF)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Download Error Message */}
      {downloadError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} className="text-rose-500" />
          <p className="text-rose-600 text-sm">{downloadError}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Jobs Metric */}
        <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={28} />
            </div>
            <ArrowUpRight size={20} className="text-slate-300" />
          </div>
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Job Postings</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-5xl font-black text-slate-900">{jobs?.total || 0}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold uppercase">
              {jobs?.active || 0} Active
            </span>
            <span className="text-[10px] bg-gray-50 text-gray-700 px-2 py-1 rounded-lg font-bold uppercase">
              {jobs?.closed || 0} Closed
            </span>
          </div>
        </div>

        {/* Candidates Metric */}
        <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users size={28} />
            </div>
            <ArrowUpRight size={20} className="text-slate-300" />
          </div>
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Applicants</h3>
          <p className="text-5xl font-black text-slate-900 mt-2">{applications?.total || 0}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg font-bold uppercase">
              {applications?.pending || 0} Pending
            </span>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold uppercase">
              {applications?.shortlisted || 0} Shortlisted
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-bold uppercase">
              {applications?.hired || 0} Hired
            </span>
            <span className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded-lg font-bold uppercase">
              {applications?.rejected || 0} Rejected
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${shortlistRate}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Shortlist Rate: {shortlistRate}%</p>
          </div>
        </div>

        {/* Interviews Metric */}
        <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-rose-50 w-14 h-14 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Calendar size={28} />
            </div>
            <ArrowUpRight size={20} className="text-slate-300" />
          </div>
          <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Interviews</h3>
          <p className="text-5xl font-black text-slate-900 mt-2">{interviews?.total || 0}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold uppercase">
              {interviews?.scheduled || 0} Scheduled
            </span>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold uppercase">
              {interviews?.completed || 0} Completed
            </span>
            <span className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded-lg font-bold uppercase">
              {interviews?.cancelled || 0} Cancelled
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <CheckCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Hire Rate: {conversionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl text-center hover:bg-slate-100 transition-colors">
          <p className="text-xs text-slate-500">Applications per Job</p>
          <p className="text-2xl font-bold text-slate-800">{applicationsPerJob}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl text-center hover:bg-slate-100 transition-colors">
          <p className="text-xs text-slate-500">Interview Rate</p>
          <p className="text-2xl font-bold text-slate-800">{interviewRate}%</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl text-center hover:bg-slate-100 transition-colors">
          <p className="text-xs text-slate-500">Interview Success</p>
          <p className="text-2xl font-bold text-green-600">{successRate}%</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl text-center hover:bg-slate-100 transition-colors">
          <p className="text-xs text-slate-500">Conversion Rate</p>
          <p className="text-2xl font-bold text-blue-600">{conversionRate}%</p>
        </div>
      </div>

      {/* Helpful Note */}
      <div className="mt-8 p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-700 p-3 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="font-bold">Need a deeper analysis?</p>
            <p className="text-slate-400 text-xs">Download the full PDF report for comprehensive insights and recommendations.</p>
          </div>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="bg-white text-slate-900 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>
    </div>
  );
}