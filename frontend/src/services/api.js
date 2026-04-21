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
    const user = JSON.parse(userData);
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }

  return config;
});

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

// =====================================
// NOTIFICATIONS ENDPOINTS
// =====================================
export const getNotifications = () =>
  API.get("/notifications");

export const markNotificationRead = (id) =>
  API.put(`/notifications/${id}/read`);

export default API;