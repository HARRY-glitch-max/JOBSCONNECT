import { createContext, useState, useEffect, useMemo } from "react";
import apiClient from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to normalize user data (ID standardization)
  const normalizeUser = (data, role) => {
    return {
      ...data,
      // Ensures components can always rely on ._id
      _id: data._id || data.id || (typeof data.employerId === 'string' ? data.employerId : data.employerId?._id),
      role: data.role || role,
      // Maintains the populated object or ID string for employer context
      employerId: data.employerId || null,
    };
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("jobConnectUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(normalizeUser(parsedUser, parsedUser.role));
      } catch (error) {
        localStorage.removeItem("jobConnectUser");
      }
    }
    setLoading(false);
  }, []);

  // ✅ Login
  const login = async (email, password, role = "jobseeker") => {
    let endpoint;
    if (role === "admin") endpoint = "/admin/login";
    else if (role === "employer") endpoint = "/employers/login";
    else endpoint = "/jobseekers/login";

    try {
      const { data } = await apiClient.post(endpoint, { email, password, role });
      const userWithRole = normalizeUser(data, role);

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
    if (role === "admin") endpoint = "/admin/register";
    else if (role === "employer") endpoint = "/employers/register";
    else endpoint = "/jobseekers/register";

    try {
      const { data } = await apiClient.post(endpoint, { ...formData, role });
      const userWithRole = normalizeUser(data, role);

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
    const userWithRole = normalizeUser(userData, userData.role);
    setUser(userWithRole);
    localStorage.setItem("jobConnectUser", JSON.stringify(userWithRole));
  };

  // ✅ Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("jobConnectUser");
  };

  // Derived values for cleaner component logic
  const authValues = useMemo(() => {
    const role = user?.role;
    return {
      user,
      login,
      register,
      logout,
      setAuthUser,
      loading,
      role,
      isCompanyAdmin: role === "admin",
      isEmployer: role === "employer",
      isJobseeker: role === "jobseeker",
      // Standardized accessors
      userId: user?._id,
      employerId: user?.employerId,
    };
  }, [user, loading]);

  return (
    <AuthContext.Provider value={authValues}>
      {!loading && children}
    </AuthContext.Provider>
  );
};