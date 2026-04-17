import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import {
  Home,
  Briefcase,
  FileText,
  Users,
  Settings,
  LogOut,
  MessageSquare,
  Bell, // ✅ Added for Notifications
} from "lucide-react";
import Button from "../ui/button";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // ✅ Fetch unread notification count for the badge
  useEffect(() => {
    if (user?._id && user?.role === "jobseeker") {
      const fetchUnreadCount = async () => {
        try {
          const { data } = await axios.get(`/api/notifications/user/${user._id}`);
          const unread = data.filter((n) => !n.isRead).length;
          setUnreadNotifications(unread);
        } catch (err) {
          console.error("Error fetching notification count", err);
        }
      };
      fetchUnreadCount();
      // Optional: Set up an interval to poll for new notifications every minute
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Define navigation items based on role
  const getNavItems = () => {
    if (!user?.role) return [];

    switch (user.role) {
      case "jobseeker":
        return [
          { to: "/jobseeker/dashboard", label: "Home", icon: Home },
          { to: "/jobs", label: "Browse Jobs", icon: Briefcase },
          { to: "/jobseeker/dashboard/applications", label: "My Applications", icon: FileText },
          { 
            to: "/jobseeker/dashboard/interviews", 
            label: "Interviews", 
            icon: Users 
          },
          { 
            to: "/jobseeker/dashboard/notifications", 
            label: "Notifications", 
            icon: Bell,
            badge: unreadNotifications // ✅ Show the red dot/count here
          },
          { to: "/jobseeker/dashboard/chat", label: "Chat", icon: MessageSquare },
          { to: "/jobseeker/dashboard/settings", label: "Settings", icon: Settings },
        ];
      case "employer":
        return [
          { to: "/employer/dashboard", label: "Home", icon: Home },
          { to: "/employer/dashboard/interviews", label: "Interviews", icon: Users },
          { to: "/employer/dashboard/chat", label: "Chat", icon: MessageSquare },
          { to: "/employer/dashboard/post-job", label: "Post Job", icon: Briefcase },
          { to: "/employer/dashboard/my-jobs", label: "My Jobs", icon: Briefcase },
          { to: "/employer/dashboard/applications", label: "Applications", icon: FileText },
          { to: "/employer/dashboard/settings", label: "Settings", icon: Settings },
        ];
      case "admin":
        return [
          { to: "/admin/dashboard", label: "Home", icon: Home },
          { to: "/admin/dashboard/jobs", label: "Manage Jobs", icon: Briefcase },
          { to: "/admin/dashboard/applications", label: "Applications", icon: FileText },
          { to: "/admin/dashboard/users", label: "Users", icon: Users },
          { to: "/admin/dashboard/settings", label: "Settings", icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {user?.role
            ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`
            : "Dashboard"}
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === to
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} />
              {label}
            </div>
            {/* ✅ Render Notification Badge */}
            {badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0)}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{user.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
            </div>
          </div>
        )}
        <Button
          onClick={logout}
          variant="danger"
          className="w-full flex items-center gap-2 justify-center"
        >
          <LogOut size={18} /> Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;