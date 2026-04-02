import axios from "axios";

const API_URL = "http://localhost:5000/api/admin";

export const getAdminReports = async () => {
  const token = localStorage.getItem("token");

  // Safety check: if no token exists, don't even bother making the request
  if (!token) {
    throw new Error("No authentication token found. Please log in again.");
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.get(`${API_URL}/reports`, config);
    return response.data;
  } catch (error) {
    // If the token is expired (401), you might want to handle it here 
    // or let the calling component handle the error message.
    throw error.response?.data || error.message;
  }
};