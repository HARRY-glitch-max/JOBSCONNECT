import axios from 'axios';

/**
 * Axios instance for JobConnect / HireFlow.
 * Updated to dynamically use the Render backend in production.
 */
const apiClient = axios.create({
  // ✅ FIX: Use VITE_API_URL from Vercel env variables, or fallback to localhost
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api', 
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  },
  // ✅ IMPORTANT: Allows cookies/sessions to work across Vercel and Render
  withCredentials: true 
});

/**
 * Request Interceptor: Global Auth Injection
 */
apiClient.interceptors.request.use(
  (config) => {
    const storageData = localStorage.getItem('jobConnectUser');
    
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        
        // Extracting token from various possible structures
        const token = parsedData.token || parsedData.data?.token || parsedData.user?.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Critical: Auth Token Parsing Error:", err);
      }
    }

    // ✅ Log requests in development to verify absolute URLs
    if (import.meta.env.MODE === 'development') {
      console.log(`🚀 Requesting: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Intelligent Error Handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (response) {
      // --- 401: Unauthorized / Token Expired ---
      if (response.status === 401) {
        if (!window.location.pathname.includes('/login')) {
          console.warn("Session expired. Clearing local state...");
          localStorage.removeItem('jobConnectUser');
          window.location.href = '/login?session=expired';
        }
      }

      // --- 405: Method Not Allowed ---
      // ✅ Logged specifically to help debug Vercel routing issues
      if (response.status === 405) {
        console.error(`❌ Method Not Allowed [405]: Ensure ${config.url} is a POST route on the backend and VITE_API_URL is correct.`);
      }

      // --- 403: Forbidden ---
      if (response.status === 403) {
        const message = response.data?.message || "Access denied.";
        console.error(`🛡️ [403]: ${message}`);
      }

      // --- 404: Missing Endpoint ---
      if (response.status === 404) {
        console.error(`🔍 [404]: ${config.url} not found. Check Render logs.`);
      }

      // --- 500: Server Crash ---
      if (response.status >= 500) {
        console.error("🔥 Server Error: Check Render dashboard for logs.");
      }
    } else if (error.request) {
      console.error("🔌 Connectivity Error: Is the Render server spinning up?");
    }

    return Promise.reject(error);
  }
);

export default apiClient;