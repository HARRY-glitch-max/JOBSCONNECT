import axios from 'axios';

/**
 * Axios instance for all API requests.
 * Standardized to communicate with the Node/Express backend on Port 5000.
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', 
  timeout: 15000, 
});

/**
 * Request Interceptor: Injects the JWT Token
 * It looks into localStorage for 'jobConnectUser' and pulls the token.
 */
apiClient.interceptors.request.use(
  (config) => {
    const storageData = localStorage.getItem('jobConnectUser');
    
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        
        // ✅ FLEXIBLE TOKEN EXTRACTION
        // We check the top level (from your AuthContext spread) 
        // and nested paths just in case the backend structure varies.
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
 * Response Interceptor: Error Handling & Session Management
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (response) {
      // --- 401: Unauthorized / Session Expired ---
      if (response.status === 401) {
        console.warn("Session expired or invalid token.");
        
        // Prevent infinite redirect loops if already on login
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('jobConnectUser');
          window.location.href = '/login?expired=true';
        }
      }

      // --- 403: Forbidden ---
      if (response.status === 403) {
        console.error("Forbidden: You do not have permission for this action.");
      }

      // --- 404: Route Not Found ---
      if (response.status === 404) {
        console.error(`404 Error: ${config.url} not found. Check backend route prefixes.`);
      }

      // --- 500: Internal Server Error ---
      if (response.status >= 500) {
        console.error("Server Error: Something went wrong on the backend.");
      }
    } else {
      // --- Network Error (Server Down) ---
      console.error("Network Error: Could not connect to the backend server at localhost:5000.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;