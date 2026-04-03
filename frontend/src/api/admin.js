import axios from "axios";

// ✅ FIXED: Changed from /api/reports to /api/admin
// Based on your logs, the backend is listening at /api/admin/reports
const API_URL = "http://localhost:5000/api/admin";

/**
 * Helper to get the auth config with Bearer token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found.");
  
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ✅ GET Dashboard Stats
// Hits: GET http://localhost:5000/api/admin/reports
export const getAdminReports = async () => {
  try {
    const config = getAuthHeaders();
    const response = await axios.get(`${API_URL}/reports`, config);
    return response.data;
  } catch (error) {
    console.error("API Error (getAdminReports):", error);
    throw error.response?.data || error.message;
  }
};

// ✅ NEW: Generate and Send Report to Employer
// Hits: POST http://localhost:5000/api/admin/reports/generate
export const generateNewReport = async () => {
  try {
    const config = getAuthHeaders();
    // Adjusted path to stay within the admin/reports namespace
    const response = await axios.post(`${API_URL}/reports/generate`, {}, config);
    return response.data;
  } catch (error) {
    console.error("API Error (generateNewReport):", error);
    throw error.response?.data || error.message;
  }
};

// ✅ GET Single Report by ID
// Hits: GET http://localhost:5000/api/admin/reports/:id
export const getReportById = async (id) => {
  try {
    const config = getAuthHeaders();
    const response = await axios.get(`${API_URL}/reports/${id}`, config);
    return response.data;
  } catch (error) {
    console.error("API Error (getReportById):", error);
    throw error.response?.data || error.message;
  }
};