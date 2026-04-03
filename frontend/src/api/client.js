import axios from 'axios';

/**
 * Axios instance for all API requests.
 * Port 5000 is used for the backend to avoid conflicts with Vite (5173).
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', 
  timeout: 15000, // Increased to 15s for heavier report generation tasks
});

/**
 * Request Interceptor
 * Dynamically retrieves the token and handles the 'jobConnectUser' key.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Matches the key used in your AuthContext for consistency
    const storageData = localStorage.getItem('jobConnectUser');
    
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        // Extracts token from various possible structures (Direct or Nested)
        const token = parsedData.token || parsedData.data?.token || parsedData.user?.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Auth Token Parsing Error:", err);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Updated to handle specific 'Report' sync errors and Session Expiry.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (response) {
      // 401: Unauthorized / Session Expired
      if (response.status === 401) {
        console.warn("Session expired or invalid token. Redirecting to login...");
        
        // Only clear and redirect if we aren't already on the login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('jobConnectUser');
          window.location.href = '/login?expired=true';
        }
      }

      // 403: Forbidden (Role Mismatch)
      if (response.status === 403) {
        console.error("Access Denied: Employers only. Check your account permissions.");
      }

      // 404: Endpoint missing
      if (response.status === 404) {
        console.error(`API Error: The endpoint ${config.url} does not exist on Port 5000.`);
      }

      // 500: Server Error (Common during complex report generation)
      if (response.status >= 500) {
        console.error("Backend Server Error: The report could not be generated at this time.");
      }
    } else {
      // Network Error (Backend is likely offline)
      console.error("Connection Refused: Ensure your Node.js/Express server is running.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;