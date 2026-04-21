import apiClient from "./client";

/**
 * Submit a new application (Jobseeker)
 * Automatically handles multipart/form-data for Resume uploads.
 */
export const submitApplication = async (formData) => {
  try {
    const { data } = await apiClient.post("/applications", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  } catch (error) {
    console.error("API: Error submitting application:", error);
    throw error;
  }
};

/**
 * Get applications for the logged-in jobseeker
 * GET /api/applications/user/:userId
 */
export const getMyApplications = async (userId) => {
  try {
    const { data } = await apiClient.get(`/applications/user/${userId}`);
    return data;
  } catch (error) {
    console.error("API: Error fetching my applications:", error);
    throw error;
  }
};

/**
 * Get all applications for jobs posted by a specific employer
 * GET /api/applications/employer/:employerId
 */
export const getEmployerApplications = async (employerId) => {
  try {
    const { data } = await apiClient.get(`/applications/employer/${employerId}`);
    return data;
  } catch (error) {
    console.error("API: Error fetching employer applications:", error);
    throw error;
  }
};

/**
 * Update application status (e.g., Shortlisted, Rejected)
 * PUT /api/applications/:applicationId/status
 */
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const { data } = await apiClient.put(`/applications/${applicationId}/status`, {
      status,
    });
    return data;
  } catch (error) {
    console.error("API: Error updating status:", error);
    throw error;
  }
};

/**
 * Get applications for a specific job listing
 */
export const getJobApplications = async (jobId) => {
  try {
    const { data } = await apiClient.get(`/applications/job/${jobId}`);
    return data;
  } catch (error) {
    console.error("API: Error fetching job applications:", error);
    throw error;
  }
};

/**
 * Get a single application detail
 */
export const getApplicationById = async (applicationId) => {
  try {
    const { data } = await apiClient.get(`/applications/${applicationId}`);
    return data;
  } catch (error) {
    console.error("API: Error fetching application by ID:", error);
    throw error;
  }
};

/**
 * Delete/Withdraw an application
 */
export const deleteApplication = async (applicationId) => {
  try {
    const { data } = await apiClient.delete(`/applications/${applicationId}`);
    return data;
  } catch (error) {
    console.error("API: Error deleting application:", error);
    throw error;
  }
};