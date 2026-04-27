import React, { useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthContext } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar";

// Pages
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import ApplyJob from "./pages/ApplyJob"; 
import ChatPage from "./pages/ChatPage";

// Password Management Pages
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";

// Profile Pages
import JobseekerProfile from "./pages/JobseekerProfile";
import EmployerProfile from "./pages/EmployerProfile";
import AdminProfile from "./pages/AdminProfile";

// Dashboards & Auth
import JobseekerLogin from "./pages/JobseekerLogin";
import JobseekerDashboard from "./pages/JobseekerDashboard";
import JobseekerRegister from "./pages/JobseekerRegister";

import EmployerLogin from "./pages/EmployerLogin";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerRegister from "./pages/EmployerRegister";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRegister from "./pages/AdminRegister";

const GlobalInputStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    input, select, textarea {
      background-color: #ffffff !important;
      color: #111827 !important;
      border: 1px solid #d1d5db !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    input::placeholder, textarea::placeholder {
      color: #9ca3af !important;
    }
    input:focus {
      border-color: #2563eb !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
    }
  `}} />
);

const AppContent = () => {
  const { loading, user, role } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Debug logging
    console.log("Current path:", location.pathname);
    console.log("User role:", role);
    console.log("Is authenticated:", !!user);
  }, [location.pathname, user, role]);

  const hideNavbar =
    location.pathname.startsWith("/employer/dashboard") ||
    location.pathname.startsWith("/admin/dashboard") ||
    location.pathname.startsWith("/jobseeker/dashboard") ||
    location.pathname.startsWith("/apply") ||
    location.pathname.startsWith("/reset-password") ||
    location.pathname.startsWith("/change-password") ||
    location.pathname.startsWith("/forgot-password");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;
  const userRole = role?.toLowerCase();

  // Protect change password route
  const ProtectedChangePassword = () => {
    if (!isAuthenticated) {
      if (userRole === "employer") return <Navigate to="/employer/login" replace />;
      if (userRole === "admin") return <Navigate to="/admin/login" replace />;
      return <Navigate to="/jobseeker/login" replace />;
    }
    return <ChangePassword />;
  };

  // Protect profile routes
  const ProtectedJobseekerProfile = () => {
    if (!isAuthenticated) return <Navigate to="/jobseeker/login" replace />;
    if (userRole !== "jobseeker") return <Navigate to="/" replace />;
    return <JobseekerProfile />;
  };

  const ProtectedEmployerProfile = () => {
    if (!isAuthenticated) return <Navigate to="/employer/login" replace />;
    if (userRole !== "employer") return <Navigate to="/" replace />;
    return <EmployerProfile />;
  };

  const ProtectedAdminProfile = () => {
    if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
    if (userRole !== "admin") return <Navigate to="/" replace />;
    return <AdminProfile />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300">
      <GlobalInputStyles />
      {!hideNavbar && <Navbar />}

      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />

          {/* Password Management Routes - Public */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Change Password - Protected */}
          <Route path="/change-password" element={<ProtectedChangePassword />} />

          {/* Registration Routes - Public */}
          <Route path="/jobseeker/register" element={<JobseekerRegister />} />
          <Route path="/employer/register" element={<EmployerRegister />} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* Authentication Routes - Public (No redirects here) */}
          <Route path="/jobseeker/login" element={<JobseekerLogin />} />
          <Route path="/employer/login" element={<EmployerLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Profile Routes - Protected */}
          <Route path="/jobseeker/profile" element={<ProtectedJobseekerProfile />} />
          <Route path="/employer/profile" element={<ProtectedEmployerProfile />} />
          <Route path="/admin/profile" element={<ProtectedAdminProfile />} />

          {/* Application Route - Protected */}
          <Route 
            path="/apply/:jobId" 
            element={isAuthenticated && userRole === "jobseeker" ? <ApplyJob /> : <Navigate to="/jobseeker/login" replace />} 
          />

          {/* Protected Dashboards */}
          <Route
            path="/jobseeker/dashboard/*"
            element={isAuthenticated && userRole === "jobseeker" ? <JobseekerDashboard /> : <Navigate to="/jobseeker/login" replace />}
          />
          <Route
            path="/employer/dashboard/*"
            element={isAuthenticated && userRole === "employer" ? <EmployerDashboard /> : <Navigate to="/employer/login" replace />}
          />
          <Route
            path="/admin/dashboard/*"
            element={isAuthenticated && userRole === "admin" ? <AdminDashboard /> : <Navigate to="/admin/login" replace />}
          />

          {/* Global Chat Access - Protected */}
          <Route 
            path="/chat/:id" 
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/" replace />} 
          />

          {/* 404 - Catch all - MUST be last */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hideNavbar && (
        <footer className="py-10 text-center text-slate-500 text-sm border-t border-slate-200 bg-white">
          © 2026 JobConnect. All rights reserved.
        </footer>
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;