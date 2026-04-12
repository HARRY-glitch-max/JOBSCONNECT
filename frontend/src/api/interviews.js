import apiClient from './client';

/**
 * @desc Create/Schedule a new interview
 * @route POST /api/interviews/job/:jobId
 */
export const bookInterview = async (jobId, payload) => {
  const { data } = await apiClient.post(`/interviews/job/${jobId}`, payload);
  return data;
};

/**
 * NEW: Fetch ALL interviews for an Employer across all jobs
 * This is the missing piece for your dashboard fetching!
 * @route GET /api/interviews/employer/:employerId
 */
export const getInterviewsByEmployer = async (employerId) => {
  const { data } = await apiClient.get(`/interviews/employer/${employerId}`);
  return data;
};

/**
 * @desc Fetch all interviews for a specific job (Employer view)
 * @route GET /api/interviews/job/:jobId
 */
export const getInterviewsByJob = async (jobId) => {
  const { data } = await apiClient.get(`/interviews/job/${jobId}`);
  return data;
};

/**
 * @desc Fetch all interviews for a specific user (Jobseeker view)
 * @route GET /api/interviews/user/:userId
 */
export const getInterviewsByUser = async (userId) => {
  const { data } = await apiClient.get(`/interviews/user/${userId}`);
  return data;
};

/**
 * @desc Get details of a single interview
 * @route GET /api/interviews/:id
 */
export const getInterviewById = async (id) => {
  const { data } = await apiClient.get(`/interviews/${id}`);
  return data;
};

/**
 * @desc Update the interview result (Pass/Fail) with feedback
 * @route PATCH /api/interviews/:id/result
 */
export const updateInterviewResult = async (id, payload) => {
  const { data } = await apiClient.patch(`/interviews/${id}/result`, payload);
  return data;
};

/**
 * @desc Cancel/Delete an interview record
 * @route DELETE /api/interviews/:id
 */
export const deleteInterview = async (id) => {
  const { data } = await apiClient.delete(`/interviews/${id}`);
  return data;
};