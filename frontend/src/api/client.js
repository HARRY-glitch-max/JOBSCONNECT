import axios from 'axios';

/**
 * Axios instance for all API requests.
 * Using an absolute URL (http://localhost:5000/api) is the safest way to 
 * avoid 404 errors caused by Vite's port mismatch (5173).
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', 
  timeout: 10000, // 10 seconds timeout
});

/**
 * Request Interceptor
 * Dynamically retrieves the token from localStorage before every request.
 */
apiClient.interceptors.request.use(
  (config) => {
    // 🔍 IMPORTANT: Verify this key matches exactly what's in your AuthContext/Login logic
    const storageData = localStorage.getItem('jobConnectUser');
    
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        // Supports both { token: "..." } or { data: { token: "..." } } structures
        const token = parsedData.token || parsedData.data?.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Could not parse auth token from localStorage", err);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handles global error cases like 401 Unauthorized or 403 Forbidden.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      // 401: Token expired or invalid
      if (response.status === 401) {
        console.warn("Session expired. Logging out...");
        localStorage.removeItem('jobConnectUser');
        // Avoid window.location.href if possible to prevent infinite loops, 
        // but it's a solid fallback if not using a router-based logout.
        // window.location.href = '/login'; 
      }

      // 403: Forbidden (Authenticated but not allowed)
      if (response.status === 403) {
        console.error("Access Denied: You do not have permission for this action.");
      }

      // 404: Route not found (Usually a backend vs frontend port issue)
      if (response.status === 404) {
        console.error(`Route Not Found: ${error.config.url}. Check backend port (5000).`);
      }
    } else {
      // Network Error (Backend server is down)
      console.error("Network Error: Please check if your backend server is running on port 5000.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;