import axios from "axios";

const API = axios.create({
  // Use VITE_API_BASE_URL for production (Render) and fallback to localhost for dev
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// =====================================
// ✅ NEW: Attach JWT Token Automatically
// This ensures 'applyToJob' and others aren't rejected as Unauthorized
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

// Helper to return just the data so your frontend components don't crash
const handleResponse = (promise) => promise.then(res => res.data);

/* ========================
   AUTH
======================== */
export const registerUser = (data) => handleResponse(API.post("/auth/register", data));
export const loginUser = (data) => handleResponse(API.post("/auth/login", data));
export const getProfile = () => handleResponse(API.get("/auth/profile"));

// Support for your specific role logins
export const loginJobseeker = (data) => handleResponse(API.post("/jobseekers/login", data));
export const loginEmployer = (data) => handleResponse(API.post("/employers/login", data));

/* ========================
   JOBS
======================== */
export const getJobs = (params) => handleResponse(API.get("/jobs", { params }));
export const getJobById = (id) => handleResponse(API.get(`/jobs/${id}`));
export const createJob = (data) => handleResponse(API.post("/jobs", data));
export const updateJob = (id, data) => handleResponse(API.put(`/jobs/${id}`, data));
export const deleteJob = (id) => handleResponse(API.delete(`/jobs/${id}`));

/* ========================
   APPLICATIONS
======================== */
export const getApplications = () => handleResponse(API.get("/applications"));

// ✅ FIXED FOR DEPLOYMENT: 
// Do NOT manually set 'Content-Type' headers here. 
// Axios automatically handles the 'boundary' for FormData.
export const applyToJob = (jobId, formData) => 
  handleResponse(API.post(`/applications/${jobId}`, formData));

// If your component calls 'submitApplication'
export const submitApplication = (formData) => 
  handleResponse(API.post("/applications", formData));

export const getMyApplications = (userId) => 
  handleResponse(API.get(`/applications/user/${userId}`));

export const updateApplication = (id, data) =>
  handleResponse(API.put(`/applications/${id}`, data));

export const deleteApplication = (id) =>
  handleResponse(API.delete(`/applications/${id}`));

export const getEmployerApplications = (employerId) =>
  handleResponse(API.get(`/applications/employer/${employerId}`));

/* ========================
   INTERVIEWS
======================== */
export const getInterviews = () => handleResponse(API.get("/interviews"));
export const scheduleInterview = (jobId, data) =>
  handleResponse(API.post(`/interviews/${jobId}`, data));
export const updateInterview = (id, data) =>
  handleResponse(API.put(`/interviews/${id}`, data));
export const cancelInterview = (id) =>
  handleResponse(API.delete(`/interviews/${id}`));
export const getEmployerInterviews = (employerId) =>
  handleResponse(API.get(`/interviews/employer/${employerId}`));

/* ========================
   NOTIFICATIONS
======================== */
export const getNotifications = () => handleResponse(API.get("/notifications"));
export const markNotificationRead = (id) =>
  handleResponse(API.put(`/notifications/${id}/read`));

/* ========================
   CHAT
======================== */
export const getChats = () => handleResponse(API.get("/chats"));
export const sendMessage = (data) => handleResponse(API.post("/chats", data));
export const getMessages = (chatId) =>
  handleResponse(API.get(`/chats/${chatId}/messages`));

export default API;