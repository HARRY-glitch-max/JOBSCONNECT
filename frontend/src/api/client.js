import axios from 'axios';

/**
 * Axios instance for JobConnect / HireFlow.
 * Automatically switches between Localhost and Render.
 */
const apiClient = axios.create({
  // ✅ THE FIX: Dynamically switch based on environment
  baseURL: import.meta.env.VITE_API_URL 
    ? `https://jobsconnect-4.onrender.com/api` 
    : 'http://localhost:5000/api', 
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  },
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
        const token = parsedData.token || parsedData.data?.token || parsedData.user?.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Critical: Auth Token Parsing Error:", err);
      }
    }

    // ✅ Better logging for debugging connectivity
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
      if (response.status === 401) {
        if (!window.location.pathname.includes('/login')) {
          console.warn("Session expired. Clearing local state...");
          localStorage.removeItem('jobConnectUser');
          window.location.href = '/login?session=expired';
        }
      }

      if (response.status === 405) {
        console.error(`❌ Method Not Allowed [405]: Request hit ${config.baseURL}${config.url}. Check if the URL is correct.`);
      }

      if (response.status === 404) {
        console.error(`🔍 [404]: ${config.url} not found on the server.`);
      }
    } else if (error.request) {
      console.error("🔌 Connectivity Error: No response received. Check your internet or if the server is awake.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;