// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import apiClient from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  // ✅ Login (no navigation here)
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

      const userWithRole = {
        ...data,
        role,
        employerId: data.employerId || data._id || data.id,
      };

      setUser(userWithRole);
      localStorage.setItem("jobConnectUser", JSON.stringify(userWithRole));
      return userWithRole; // caller handles navigation
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  // ✅ Register (no navigation here)
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
        role,
        employerId: data.employerId || data._id || data.id,
      };

      setUser(userWithRole);
      localStorage.setItem("jobConnectUser", JSON.stringify(userWithRole));
      return userWithRole; // caller handles navigation
    } catch (err) {
      console.error("Registration failed:", err.response?.data || err.message);
      throw err;
    }
  };

  // ✅ Setter
  const setAuthUser = (userData) => {
    const userWithRole = {
      ...userData,
      role: userData.role || "jobseeker",
      employerId: userData.employerId || userData._id || userData.id,
    };
    setUser(userWithRole);
    localStorage.setItem("jobConnectUser", JSON.stringify(userWithRole));
  };

  // ✅ Logout (no navigation here)
  const logout = () => {
    setUser(null);
    localStorage.removeItem("jobConnectUser");
    // caller handles navigation
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
        employerId: user?.employerId,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};