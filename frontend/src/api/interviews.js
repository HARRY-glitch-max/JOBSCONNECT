import apiClient from './client';

/**
 * @desc Create/Schedule a new interview
 * @route POST /api/interviews/job/:jobId
 * @param {string} jobId 
 * @param {object} payload - { applicantId, date, time, location }
 */
export const bookInterview = async (jobId, payload) => {
  const { data } = await apiClient.post(`/interviews/job/${jobId}`, payload);
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
 * @param {string} id - The Interview ID
 * @param {object} payload - { result: 'passed' | 'failed', feedback: string }
 */
export const updateInterviewResult = async (id, payload) => {
  // Logic: Payload must contain both 'result' and 'feedback'
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