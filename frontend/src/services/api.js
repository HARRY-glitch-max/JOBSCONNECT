// src/services/api.js
import axios from "axios";

// =====================================
// Axios Instance
// =====================================
const API = axios.create({
  baseURL: import.meta.env.PROD
    ? "https://jobsconnect-4.onrender.com/api" // ✅ Production (Render)
    : "http://localhost:5000/api",             // ✅ Local development
  withCredentials: true,
});

// =====================================
// Attach JWT Token Automatically
// =====================================
API.interceptors.request.use((config) => {
  const userData = localStorage.getItem("jobConnectUser");

  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
        console.log(`🔐 Token attached for ${user.role || 'user'}`);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  return config;
});

// Response interceptor for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Authentication error:", error.response?.data?.message);
      // Optional: Clear local storage and redirect to login
      // localStorage.removeItem("jobConnectUser");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// =====================================
// AUTH ENDPOINTS
// =====================================
export const loginJobseeker = (data) =>
  API.post("/jobseekers/login", data);

export const loginEmployer = (data) =>
  API.post("/employers/login", data);

export const loginAdmin = (data) =>
  API.post("/admin/login", data);

// =====================================
// REGISTRATION ENDPOINTS
// =====================================
export const registerJobseeker = (data) =>
  API.post("/jobseekers/register", data);

export const registerEmployer = (data) =>
  API.post("/employers/register", data);

export const registerAdmin = (data) =>
  API.post("/admin/register", data);

// =====================================
// PASSWORD MANAGEMENT ENDPOINTS
// =====================================

// Forgot Password - Request reset link
export const forgotJobseekerPassword = (email) =>
  API.post("/jobseekers/forgot-password", { email });

export const forgotEmployerPassword = (email) =>
  API.post("/employers/forgot-password", { email });

export const forgotAdminPassword = (email) =>
  API.post("/admin/forgot-password", { email });

// Reset Password - Set new password using token
export const resetJobseekerPassword = (token, password) =>
  API.patch(`/jobseekers/reset-password/${token}`, { password });

export const resetEmployerPassword = (token, password) =>
  API.patch(`/employers/reset-password/${token}`, { password });

export const resetAdminPassword = (token, password) =>
  API.patch(`/admin/reset-password/${token}`, { password });

// Change Password - While logged in
export const changeJobseekerPassword = (currentPassword, newPassword) =>
  API.put("/jobseekers/change-password", { currentPassword, newPassword });

export const changeEmployerPassword = (currentPassword, newPassword) =>
  API.put("/employers/change-password", { currentPassword, newPassword });

export const changeAdminPassword = (currentPassword, newPassword) =>
  API.put("/admin/change-password", { currentPassword, newPassword });

// =====================================
// PROFILE ENDPOINTS
// =====================================
export const getJobseekerProfile = () =>
  API.get("/jobseekers/profile/me");

export const updateJobseekerProfile = (data) =>
  API.put("/jobseekers/profile/me", data);

export const getEmployerProfile = () =>
  API.get("/employers/profile/me");

export const updateEmployerProfile = (data) =>
  API.put("/employers/profile/me", data);

export const getAdminProfile = () =>
  API.get("/admin/profile/me");

export const updateAdminProfile = (data) =>
  API.put("/admin/profile/me", data);

// =====================================
// JOBSEEKER MANAGEMENT
// =====================================
export const getJobseekers = () =>
  API.get("/jobseekers");

export const getJobseekerById = (id) =>
  API.get(`/jobseekers/${id}`);

export const updateJobseekerById = (id, data) =>
  API.put(`/jobseekers/${id}`, data);

export const deleteJobseekerById = (id) =>
  API.delete(`/jobseekers/${id}`);

export const notifyJobseekerById = (id, data) =>
  API.post(`/jobseekers/${id}/notify`, data);

// =====================================
// EMPLOYER MANAGEMENT
// =====================================
export const getEmployers = () =>
  API.get("/employers");

export const getEmployerById = (id) =>
  API.get(`/employers/${id}`);

export const updateEmployerById = (id, data) =>
  API.put(`/employers/${id}`, data);

export const deleteEmployerById = (id) =>
  API.delete(`/employers/${id}`);

// =====================================
// ADMIN REPORTS
// =====================================
export const getAdminReports = () =>
  API.get("/admin/reports");

export const generateNewReport = () =>
  API.post("/admin/reports/generate");

// =====================================
// JOB ENDPOINTS
// =====================================
export const getJobs = (params) =>
  API.get("/jobs", { params });

export const getJobById = (jobId) =>
  API.get(`/jobs/${jobId}`);

export const applyToJob = (jobId, data) =>
  API.post(`/jobs/${jobId}/apply`, data);

export const createJob = (data) =>
  API.post("/jobs", data);

export const updateJob = (jobId, data) =>
  API.put(`/jobs/${jobId}`, data);

export const deleteJob = (jobId) =>
  API.delete(`/jobs/${jobId}`);

export const getEmployerJobs = () =>
  API.get("/employers/jobs");

export const getJobApplications = (jobId) =>
  API.get(`/employers/jobs/${jobId}/applications`);

export const shortlistCandidate = (applicationId) =>
  API.put(`/applications/${applicationId}/shortlist`);

// =====================================
// APPLICATION ENDPOINTS
// =====================================
export const getApplications = () =>
  API.get("/applications");

export const getApplicationById = (appId) =>
  API.get(`/applications/${appId}`);

export const withdrawApplication = (appId) =>
  API.delete(`/applications/${appId}`);

export const getEmployerApplications = (employerId) =>
  API.get(`/applications/employer/${employerId}`);

// =====================================
// CHAT ENDPOINTS
// =====================================
export const getInbox = (userId) =>
  API.get(`/chats/user/${userId}`);

export const getChatHistory = (senderId, receiverId) =>
  API.get(`/chats/history/${senderId}/${receiverId}`);

export const sendChatMessage = (data) =>
  API.post("/chats", data);

// =====================================
// INTERVIEW ENDPOINTS
// =====================================
export const scheduleInterview = (jobId, data) =>
  API.post(`/jobs/${jobId}/interviews`, data);

export const getInterviews = () =>
  API.get("/interviews");

export const cancelInterview = (interviewId) =>
  API.delete(`/interviews/${interviewId}`);

export const getEmployerInterviews = () =>
  API.get("/employers/interviews");

export const updateInterviewStatus = (interviewId, data) =>
  API.put(`/employers/interviews/${interviewId}/status`, data);

// =====================================
// NOTIFICATIONS ENDPOINTS
// =====================================
export const getNotifications = () =>
  API.get("/notifications");

export const markNotificationRead = (id) =>
  API.put(`/notifications/${id}/read`);

// =====================================
// HELPER FUNCTION: Universal password management
// =====================================

/**
 * Universal forgot password function
 * @param {string} email - User's email address
 * @param {string} role - User role (admin, employer, jobseeker)
 * @returns {Promise} API response
 */
export const forgotPassword = async (email, role) => {
  if (!email || !role) {
    throw new Error('Email and role are required');
  }
  
  switch(role) {
    case 'admin':
      return forgotAdminPassword(email);
    case 'employer':
      return forgotEmployerPassword(email);
    case 'jobseeker':
      return forgotJobseekerPassword(email);
    default:
      throw new Error('Invalid role specified. Use: admin, employer, or jobseeker');
  }
};

/**
 * Universal reset password function
 * @param {string} token - Reset token from email
 * @param {string} password - New password
 * @param {string} role - User role (admin, employer, jobseeker)
 * @returns {Promise} API response
 */
export const resetPassword = async (token, password, role) => {
  if (!token || !password || !role) {
    throw new Error('Token, password, and role are required');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  switch(role) {
    case 'admin':
      return resetAdminPassword(token, password);
    case 'employer':
      return resetEmployerPassword(token, password);
    case 'jobseeker':
      return resetJobseekerPassword(token, password);
    default:
      throw new Error('Invalid role specified. Use: admin, employer, or jobseeker');
  }
};

/**
 * Universal change password function (while logged in)
 * @param {string} currentPassword - User's current password
 * @param {string} newPassword - Desired new password
 * @param {string} role - User role (admin, employer, jobseeker)
 * @returns {Promise} API response
 */
export const changePassword = async (currentPassword, newPassword, role) => {
  if (!currentPassword || !newPassword || !role) {
    throw new Error('Current password, new password, and role are required');
  }
  
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }
  
  if (currentPassword === newPassword) {
    throw new Error('New password must be different from current password');
  }
  
  switch(role) {
    case 'admin':
      return changeAdminPassword(currentPassword, newPassword);
    case 'employer':
      return changeEmployerPassword(currentPassword, newPassword);
    case 'jobseeker':
      return changeJobseekerPassword(currentPassword, newPassword);
    default:
      throw new Error('Invalid role specified. Use: admin, employer, or jobseeker');
  }
};

/**
 * Get the current user's role from localStorage
 * @returns {string|null} User role or null if not logged in
 */
export const getUserRole = () => {
  try {
    const userData = localStorage.getItem("jobConnectUser");
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

/**
 * Get the current user's token from localStorage
 * @returns {string|null} User token or null if not logged in
 */
export const getUserToken = () => {
  try {
    const userData = localStorage.getItem("jobConnectUser");
    if (userData) {
      const user = JSON.parse(userData);
      return user.token || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting user token:", error);
    return null;
  }
};

/**
 * Get the current user's full data from localStorage
 * @returns {object|null} User object or null if not logged in
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem("jobConnectUser");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  try {
    const userData = localStorage.getItem("jobConnectUser");
    if (userData) {
      const user = JSON.parse(userData);
      return !!user?.token;
    }
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Logout user - clear local storage
 */
export const logout = () => {
  localStorage.removeItem("jobConnectUser");
  // Optional: redirect to home
  // window.location.href = "/";
};

/**
 * Update user data in localStorage after profile update
 * @param {object} updatedData - Updated user data
 */
export const updateLocalUser = (updatedData) => {
  try {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedData };
      localStorage.setItem("jobConnectUser", JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  } catch (error) {
    console.error("Error updating local user:", error);
    return null;
  }
};

export default API;

