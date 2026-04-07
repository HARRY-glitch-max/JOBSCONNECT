import apiClient from './client';

/**
 * Fetch all interviews for the logged-in employer
 */
export const getMyInterviews = async () => {
  // Ensure this points to the employer-specific interview route
  const { data } = await apiClient.get('/employers/interviews'); 
  return data;
};

/**
 * Update the interview result (Pass/Fail)
 * @param {string} id - The Interview ID
 * @param {string} result - Must be 'passed' or 'failed'
 */
export const updateInterviewStatus = async (id, result) => {
  // ✅ FIX 1: Use PUT instead of PATCH to match employerController.js
  // ✅ FIX 2: Added '/status' to the URL path to match employerRoutes.js
  const { data } = await apiClient.put(`/employers/interviews/${id}/status`, { 
    result, 
    status: 'completed' // Automatically mark the meeting event as finished
  });
  return data;
};