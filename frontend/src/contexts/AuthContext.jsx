import { createContext, useState, useEffect } from "react";
import apiClient from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Standardizing the key to 'jobConnectUser' as per your setup
    const savedUser = localStorage.getItem("jobConnectUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("jobConnectUser");
      }
    }
    setLoading(false);
  }, []);

  // ✅ Login
  const login = async (email, password, role = "jobseeker") => {
    let endpoint;
    if (role === "admin") {
      endpoint = "/admin/login";
    } else if (role === "employer") {
      endpoint = "/employers/login";
    } else {
      endpoint = "/jobseekers/login";
    }

    try {
      const { data } = await apiClient.post(endpoint, { email, password, role });

      // ✅ FIXED: We prioritize the populated employerId object from the backend
      const userWithRole = {
        ...data,
        role: data.role || role,
        // If it's an admin, data.employerId is now the populated object
        employerId: data.employerId || null, 
      };

      setUser(userWithRole);
      localStorage.setItem("jobConnectUser", JSON.stringify(userWithRole));
      return userWithRole; 
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  // ✅ Register
  const register = async (formData, role = "jobseeker") => {
    let endpoint;
    if (role === "admin") {
      endpoint = "/admin/register";
    } else if (role === "employer") {
      endpoint = "/employers/register";
    } else {
      endpoint = "/jobseekers/register";
    }

    try {
      const { data } = await apiClient.post(endpoint, { ...formData, role });

      const userWithRole = {
        ...data,
        role: data.role || role,
        employerId: data.employerId || null,
      };

      setUser(userWithRole);
      localStorage.setItem("jobConnectUser", JSON.stringify(userWithRole));
      return userWithRole;
    } catch (err) {
      console.error("Registration failed:", err.response?.data || err.message);
      throw err;
    }
  };

  // ✅ Manual Setter
  const setAuthUser = (userData) => {
    const userWithRole = {
      ...userData,
      role: userData.role || "jobseeker",
      employerId: userData.employerId || null,
    };
    setUser(userWithRole);
    localStorage.setItem("jobConnectUser", JSON.stringify(userWithRole));
  };

  // ✅ Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("jobConnectUser");
    // Navigation is handled by the component calling logout
  };

  const role = user?.role;
  const isCompanyAdmin = role === "admin";
  const isEmployer = role === "employer";
  const isJobseeker = role === "jobseeker";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        setAuthUser,
        loading,
        role,
        isCompanyAdmin,
        isEmployer,
        isJobseeker,
        // ✅ This will now return the object or the string ID correctly
        employerId: user?.employerId, 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};