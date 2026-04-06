import { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Button from "./ui/Button";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const rawRole = user?.role || user?.roles || user?.accountType;
  const role = typeof rawRole === 'string' ? rawRole.toLowerCase() : "";

  return (
    /* Lighting Update: 
       - Fixed top with sticky/fixed
       - Changed from solid blue to bg-slate-950/40 (Glassmorphism)
       - Added backdrop-blur-md for a frosted glass look
       - Added border-b with white/10 for 'edge lighting'
    */
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo Lighting: Added a subtle glow text-shadow */}
        <Link to="/" className="text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:text-blue-400 transition-all">
          JobConnect
        </Link>

        <ul className="flex space-x-6 text-slate-300 font-medium items-center">
          {!user && (
            <li>
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
            </li>
          )}

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
                  <li><NavLink to="/admin/reports" className={({isActive}) => isActive ? "text-blue-400" : "hover:text-white"}>Reports</NavLink></li>
                </>
              )}

              <li className="pl-4 border-l border-white/20 text-sm text-slate-400 uppercase tracking-widest font-bold">
                {user.name || user.companyName}
              </li>

              <li>
                <Button
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-1.5 rounded-lg font-bold transition-all backdrop-blur-sm"
                >
                  Logout
                </Button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login" className="hover:text-white">Login</NavLink></li>
              <li><NavLink to="/register" className="hover:text-white">Register</NavLink></li>
              <li>
                {/* Admin Portal Lighting: Added a slight cyan glow to make it stand out */}
                <NavLink 
                  to="/admin/login" 
                  className="bg-blue-600/20 text-blue-400 border border-blue-500/50 px-3 py-1.5 rounded-lg hover:bg-blue-600/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
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
}