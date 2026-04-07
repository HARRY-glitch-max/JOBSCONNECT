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
  }, [location.pathname]);

  const hideNavbar =
    location.pathname.startsWith("/employer/dashboard") ||
    location.pathname.startsWith("/admin/dashboard") ||
    location.pathname.startsWith("/jobseeker/dashboard") ||
    location.pathname.startsWith("/apply");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;
  const userRole = role?.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300">
      <GlobalInputStyles />
      {!hideNavbar && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />

          {/* REGISTRATION */}
          <Route path="/jobseeker/register" element={<JobseekerRegister />} />
          <Route path="/employer/register" element={<EmployerRegister />} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* APPLICATION */}
          <Route 
            path="/apply/:jobId" 
            element={isAuthenticated && userRole === "jobseeker" ? <ApplyJob /> : <Navigate to="/jobseeker/login" replace />} 
          />

          {/* AUTH */}
          <Route path="/jobseeker/login" element={!isAuthenticated ? <JobseekerLogin /> : <Navigate to="/jobseeker/dashboard" replace />} />
          <Route path="/employer/login" element={!isAuthenticated ? <EmployerLogin /> : <Navigate to="/employer/dashboard" replace />} />
          <Route path="/admin/login" element={!isAuthenticated ? <AdminLogin /> : <Navigate to="/admin/dashboard" replace />} />

          {/* PROTECTED DASHBOARDS */}
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

          {/* GLOBAL CHAT ACCESS */}
          <Route 
            path="/chat/:id" 
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/" replace />} 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hideNavbar && (
        <footer className="py-10 text-center text-slate-500 text-sm border-t border-slate-200 bg-white">
          © 2026 HireFlow. All rights reserved.
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