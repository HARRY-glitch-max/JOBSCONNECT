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

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import ApplyJob from "./pages/ApplyJob"; 

// Shared
import ChatPage from "./pages/ChatPage";

// Jobseeker
import JobseekerLogin from "./pages/JobseekerLogin";
import JobseekerDashboard from "./pages/JobseekerDashboard";
import JobseekerRegister from "./pages/JobseekerRegister"; // ✅ Added

// Employer
import EmployerLogin from "./pages/EmployerLogin";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerRegister from "./pages/EmployerRegister"; // ✅ Added

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRegister from "./pages/AdminRegister"; // ✅ Added

const AppContent = () => {
  const { loading, user, role } = useContext(AuthContext);
  const location = useLocation();

  // Debugging navigation
  useEffect(() => {
    console.log("📍 Navigation Change:", location.pathname);
  }, [location]);

  // Logic to hide general Navbar when inside any dashboard or application flow
  const hideNavbar =
    location.pathname.startsWith("/employer/dashboard") ||
    location.pathname.startsWith("/admin/dashboard") ||
    location.pathname.startsWith("/jobseeker/dashboard") ||
    location.pathname.startsWith("/apply");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {!hideNavbar && <Navbar />}

      <main>
        <Routes>
          {/* 1. PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />

          {/* 2. REGISTRATION ROUTES (Fixed your issue) */}
          <Route path="/jobseeker/register" element={<JobseekerRegister />} />
          <Route path="/employer/register" element={<EmployerRegister />} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* 3. APPLICATION ROUTE */}
          <Route 
            path="/apply/:jobId" 
            element={
              isAuthenticated && role?.toLowerCase() === "jobseeker" 
                ? <ApplyJob /> 
                : <Navigate to="/jobseeker/login" replace />
            } 
          />

          {/* 4. AUTH ROUTES (Login) */}
          <Route
            path="/jobseeker/login"
            element={!isAuthenticated ? <JobseekerLogin /> : <Navigate to="/jobseeker/dashboard" replace />}
          />
          <Route
            path="/employer/login"
            element={!isAuthenticated ? <EmployerLogin /> : <Navigate to="/employer/dashboard" replace />}
          />
          <Route
            path="/admin/login"
            element={!isAuthenticated ? <AdminLogin /> : <Navigate to="/admin/dashboard" replace />}
          />

          {/* 5. PROTECTED DASHBOARDS */}
          <Route
            path="/jobseeker/dashboard/*"
            element={isAuthenticated && role?.toLowerCase() === "jobseeker" ? <JobseekerDashboard /> : <Navigate to="/jobseeker/login" replace />}
          />
          <Route
            path="/employer/dashboard/*"
            element={isAuthenticated && role?.toLowerCase() === "employer" ? <EmployerDashboard /> : <Navigate to="/employer/login" replace />}
          />
          <Route
            path="/admin/dashboard/*"
            element={isAuthenticated && role?.toLowerCase() === "admin" ? <AdminDashboard /> : <Navigate to="/admin/login" replace />}
          />

          {/* 6. GLOBAL FALLBACK ROUTES */}
          <Route path="/chat" element={isAuthenticated ? <ChatPage /> : <Navigate to="/" replace />} />
          <Route path="/chat/:receiverId" element={isAuthenticated ? <ChatPage /> : <Navigate to="/" replace />} />

          {/* 7. FALLBACK */}
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