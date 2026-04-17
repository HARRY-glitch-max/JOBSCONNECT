import React, { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
// FIX: Path corrected to step out of 'layout' into 'components' then into 'ui'
import Button from "../ui/Button"; 

const Navbar = () => {
  const { user, login, register, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Standardize role detection
  const rawRole = user?.role || user?.roles || user?.accountType;
  const role = typeof rawRole === 'string' ? rawRole.toLowerCase() : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* REBRANDED Logo with Lighting Effects */}
        <Link to="/" className="text-2xl font-black text-white tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:text-blue-400 transition-all uppercase">
          JOBCONNECT
        </Link>

        <ul className="flex space-x-6 text-slate-300 font-medium items-center">
          {/* Public Navigation */}
          {!user && (
            <li>
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
            </li>
          )}

          {/* Role-Based Navigation */}
          {user ? (
            <>
              {role === "jobseeker" && (
                <>
                  <li><NavLink to="/jobs" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Find Jobs</NavLink></li>
                  <li><NavLink to="/my-applications" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Applied</NavLink></li>
                  <li><NavLink to="/chat" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Messages</NavLink></li>
                </>
              )}

              {role === "employer" && (
                <>
                  <li><NavLink to="/employer/dashboard" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Dashboard</NavLink></li>
                  <li><NavLink to="/jobs/create" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Post Job</NavLink></li>
                  <li><NavLink to="/chat" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Inbox</NavLink></li>
                </>
              )}

              {role === "admin" && (
                <>
                  <li><NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Admin Panel</NavLink></li>
                </>
              )}

              {/* User Identity Chip */}
              <li className="pl-4 border-l border-white/20 text-[10px] text-slate-400 uppercase tracking-widest font-black">
                {user.name || user.companyName || "Member"}
              </li>

              <li>
                <Button
                  variant="danger"
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-rose-600 hover:text-white border-white/20 px-4 py-1.5 rounded-lg font-bold text-xs transition-all backdrop-blur-sm"
                >
                  Logout
                </Button>
              </li>
            </>
          ) : (
            <>
              {/* Auth Links */}
              <li><NavLink to="/login" className="hover:text-white">Login</NavLink></li>
              <li><NavLink to="/register" className="hover:text-white font-bold text-blue-400">Join Now</NavLink></li>
              <li>
                <NavLink 
                  to="/admin/login" 
                  className="bg-blue-600/20 text-blue-400 border border-blue-500/50 px-3 py-1.5 rounded-lg hover:bg-blue-600/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all text-xs font-bold uppercase"
                >
                  Admin Portal
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;