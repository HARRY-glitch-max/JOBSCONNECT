import axios from 'axios';

/**
 * Axios instance for JobConnect / HireFlow.
 * Communicates with the Node/Express backend on Port 5000.
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', 
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Request Interceptor: Global Auth Injection
 * Dynamically pulls the latest JWT from localStorage before every request.
 */
apiClient.interceptors.request.use(
  (config) => {
    const storageData = localStorage.getItem('jobConnectUser');
    
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        
        // Extracting token from various possible structures (User, Admin, or Employer)
        const token = parsedData.token || parsedData.data?.token || parsedData.user?.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Critical: Auth Token Parsing Error:", err);
      }
    }

    // Logging for development to debug "0 info" issues
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Requesting: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Intelligent Error Handling
 * Manages session expiration, permission denials, and server sync errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (response) {
      // --- 401: Unauthorized / Token Expired ---
      if (response.status === 401) {
        // Only redirect if we aren't already on the login page to avoid loops
        if (!window.location.pathname.includes('/login')) {
          console.warn("Session expired. Clearing local state...");
          localStorage.removeItem('jobConnectUser');
          window.location.href = '/login?session=expired';
        }
      }

      // --- 403: Forbidden (e.g., Non-Admin trying to Generate Report) ---
      if (response.status === 403) {
        const message = response.data?.message || "You don't have permission for this action.";
        console.error(`🛡️ Access Denied [403]: ${message}`);
        // You could trigger a toast notification here
      }

      // --- 404: Missing Endpoint ---
      if (response.status === 404) {
        console.error(`🔍 API Route Missing [404]: ${config.url}. Check backend index.js routes.`);
      }

      // --- 500 & Above: Backend Crashes ---
      if (response.status >= 500) {
        console.error("🔥 Server Error: The backend encountered an unhandled exception.");
      }
    } else if (error.request) {
      // --- Network Error (Backend not running) ---
      console.error("🔌 Connectivity Error: No response from server. Is the Node server running on port 5000?");
    } else {
      console.error("⚠️ Axios Error:", error.message);
    }

    // Always return the error so the calling component's catch() block can handle it
    return Promise.reject(error);
  }
);

export default apiClient;