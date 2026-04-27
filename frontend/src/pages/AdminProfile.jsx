// src/pages/AdminProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import { getAdminProfile, updateAdminProfile, changeAdminPassword } from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Key, Eye, EyeOff, Loader2, Save, User, Mail, Building2 } from "lucide-react";

export default function AdminProfile() {
  const navigate = useNavigate();
  const { login: setAuth, logout } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    employerId: "",
    role: "admin",
  });
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Password form states
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getAdminProfile();
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await updateAdminProfile(profile);
      setSuccess("Profile updated successfully!");
      setAuth(res.data, res.data.token);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await changeAdminPassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess(response.data.message || "Password changed successfully!");
      
      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Auto logout after 3 seconds
      setTimeout(() => {
        logout();
        navigate("/admin/login");
      }, 3000);
      
    } catch (err) {
      if (err.response?.status === 401) {
        setPasswordError("Current password is incorrect. Please try again.");
      } else {
        setPasswordError(err.response?.data?.message || "Failed to change password. Please try again.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  
  const getStrengthText = () => {
    if (passwordStrength === 4) return 'Strong';
    if (passwordStrength === 3) return 'Good';
    if (passwordStrength === 2) return 'Weak';
    if (passwordStrength === 1) return 'Very Weak';
    return '';
  };

  const getStrengthColor = () => {
    if (passwordStrength === 4) return 'bg-green-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 1) return 'bg-red-500';
    return 'bg-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
              <p className="text-purple-100 mt-1">Manage your administrator account settings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-4 px-6 font-semibold text-sm transition-all flex items-center gap-2 ${
              activeTab === "profile"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <User size={18} />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-4 px-6 font-semibold text-sm transition-all flex items-center gap-2 ${
              activeTab === "password"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Key size={18} />
            Change Password
          </button>
        </div>

        <div className="p-8">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
                  {success}
                </div>
              )}
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employer ID
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="employerId"
                      value={profile.employerId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Associated Employer ID"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The employer account this admin manages
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {saving ? "Saving..." : "Update Profile"}
                </Button>
              </form>
            </>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Key size={32} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                <p className="text-gray-500 mt-1">Update your password to keep your account secure</p>
              </div>

              {passwordSuccess && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter new password (min. 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {getStrengthText()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-xs ${passwordData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                          ✓ At least 6 characters
                        </span>
                        <span className={`text-xs ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          ✓ Uppercase
                        </span>
                        <span className={`text-xs ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          ✓ Lowercase
                        </span>
                        <span className={`text-xs ${/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          ✓ Number
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword 
                          ? "border-red-300 bg-red-50" 
                          : "border-gray-300"
                      }`}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                {/* Security Note */}
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs text-purple-800">
                    🔒 For security, you will be logged out after changing your password and will need to log in again.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {passwordLoading ? <Loader2 className="animate-spin" size={18} /> : <Key size={18} />}
                  {passwordLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}