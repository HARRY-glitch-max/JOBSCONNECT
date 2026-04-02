// src/pages/AdminReports.jsx
import { useEffect, useState } from "react";
import { getAdminReports } from "../services/api";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await getAdminReports();
        setReports(res.data);
      } catch (err) {
        console.error("Failed to load reports:", err.response?.data || err.message);
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <p className="p-6">Loading reports...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h2 className="text-3xl font-bold mb-8 text-blue-700">Employer Reports</h2>

      {reports ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Jobs */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Jobs</h3>
            <ul className="space-y-2 text-gray-700">
              <li>Total: {reports.jobs.total}</li>
              <li>Active: {reports.jobs.active}</li>
              <li>Closed: {reports.jobs.closed}</li>
            </ul>
          </div>

          {/* Applications */}
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Applications</h3>
            <ul className="space-y-2 text-gray-700">
              <li>Total: {reports.applications.total}</li>
              <li>Shortlisted: {reports.applications.shortlisted}</li>
              <li>Hired: {reports.applications.hired}</li>
              <li>Rejected: {reports.applications.rejected}</li>
              <li>Pending: {reports.applications.pending}</li>
            </ul>
          </div>

          {/* Interviews */}
          <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">Interviews</h3>
            <ul className="space-y-2 text-gray-700">
              <li>Total: {reports.interviews.total}</li>
              <li>Scheduled: {reports.interviews.scheduled}</li>
              <li>Completed: {reports.interviews.completed}</li>
              <li>Cancelled: {reports.interviews.cancelled}</li>
            </ul>
          </div>
        </div>
      ) : (
        <p>No report data available.</p>
      )}
    </div>
  );
}
