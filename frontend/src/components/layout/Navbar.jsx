// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import { Briefcase, Home, LogIn, UserPlus, LogOut, Sun, Moon, RefreshCcw } from "lucide-react";
import Button from "../ui/button";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);

  const loginRef = useRef(null);
  const registerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleReload = () => {
    // Default: full page reload
    window.location.reload();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setShowLoginMenu(false);
      }
      if (registerRef.current && !registerRef.current.contains(event.target)) {
        setShowRegisterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Close with ESC key
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowLoginMenu(false);
        setShowRegisterMenu(false);
      }
    };
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Briefcase className="h-7 w-7" />
            <span className="text-xl font-bold tracking-tight">JobConnect</span>
          </Link>
          <Link to="/" className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
            <Home size={18} /> Home
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Reload Button */}
          <button 
            onClick={handleReload}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Reload"
          >
            <RefreshCcw size={20} />
          </button>

          {!user ? (
            <div className="flex items-center gap-4">
              {/* Login Dropdown */}
              <div className="relative" ref={loginRef}>
                <Button onClick={() => setShowLoginMenu(!showLoginMenu)}>
                  <LogIn size={18} /> Login
                </Button>
                {showLoginMenu && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg 
                                  bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 
                                  animate-fadeIn">
                    <ul className="py-1">
                      <li>
                        <button
                          onClick={() => navigate("/jobseeker/login")}
                          className="block w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 
                                     hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200"
                        >
                          Jobseeker
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => navigate("/employer/login")}
                          className="block w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 
                                     hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200"
                        >
                          Employer
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => navigate("/admin/login")}
                          className="block w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 
                                     hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200"
                        >
                          Admin
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Register Dropdown */}
              <div className="relative" ref={registerRef}>
                <Button onClick={() => setShowRegisterMenu(!showRegisterMenu)} variant="secondary">
                  <UserPlus size={18} /> Register
                </Button>
                {showRegisterMenu && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg 
                                  bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 
                                  animate-fadeIn">
                    <ul className="py-1">
                      <li>
                        <button
                          onClick={() => navigate("/jobseeker/register")}
                          className="block w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 
                                     hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200"
                        >
                          Jobseeker
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => navigate("/employer/register")}
                          className="block w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 
                                     hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200"
                        >
                          Employer
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => navigate("/admin/register")}
                          className="block w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 
                                     hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200"
                        >
                          Admin
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to={`/${user.role}/dashboard`} className="text-sm font-semibold hover:text-blue-600">
                Dashboard
              </Link>
              <Button onClick={handleLogout} variant="danger">
                <LogOut size={18} /> Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
