import axios from 'axios';

/**
 * Axios instance for JobConnect
 * Dynamically switches between Localhost and Render based on environment
 */
const getBaseURL = () => {
  // Check if we're in production build
  if (import.meta.env.PROD) {
    return 'https://jobsconnect-4.onrender.com/api';
  }
  // Development - always use localhost
  return 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
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
          if (import.meta.env.DEV) {
            console.log(`✅ Token attached for ${config.url}`);
          }
        } else {
          console.warn(`⚠️ No token found for ${config.url}`);
        }
      } catch (err) {
        console.error("Critical: Auth Token Parsing Error:", err);
      }
    } else {
      console.warn(`⚠️ No user data in localStorage for ${config.url}`);
    }

    if (import.meta.env.DEV) {
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

      if (response.status === 404) {
        console.error(`🔍 [404]: ${config.url} not found on the server.`);
        console.error(`💡 Full URL attempted: ${config.baseURL}${config.url}`);
        console.error(`💡 Make sure your backend is running on ${config.baseURL}`);
      }

      if (response.status === 500) {
        console.error(`💥 Server Error [500]: ${config.url} - ${response.data?.message || 'Internal server error'}`);
      }
    } else if (error.request) {
      console.error("🔌 Connectivity Error: No response received. Check if backend is running on", config?.baseURL);
    }

    return Promise.reject(error);
  }
);

/**
 * ✅ Helper function to handle blob responses (for PDF downloads)
 */
export const downloadBlob = async (url, filename) => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob'
    });
    
    // Check if response is actually an error
    if (response.data.type === 'application/json') {
      const text = await response.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "Failed to generate report");
    }
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true };
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

/**
 * ✅ Fetch employer report data (JSON)
 */
export const getEmployerReports = async () => {
  try {
    const response = await apiClient.get('/employers/reports');
    return response;
  } catch (error) {
    console.error("Fetch reports error:", error);
    throw error;
  }
};

/**
 * ✅ Download employer report as PDF
 */
export const downloadEmployerReport = async () => {
  return downloadBlob('/employers/reports/download', `JobConnect_Hiring_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * ✅ Fetch employer analytics (alias for getEmployerReports)
 */
export const getEmployerAnalytics = async () => {
  return getEmployerReports();
};

/**
 * ✅ Check API health
 */
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error("API health check failed:", error);
    return { status: 'error', message: 'API unavailable' };
  }
};

export default apiClient;