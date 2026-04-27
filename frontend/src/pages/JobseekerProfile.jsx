// src/pages/JobseekerProfile.jsx
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import { getJobseekerProfile, updateJobseekerProfile, changeJobseekerPassword } from "../services/api"; // ✅ Added changeJobseekerPassword
import { AuthContext } from "../contexts/AuthContext";

export default function JobseekerProfile() {
  const navigate = useNavigate();
  const { login: setAuth, user, logout } = useContext(AuthContext);

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    skills: [],
    cv: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'password'
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getJobseekerProfile();
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle profile field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  // Handle skills change
  const handleSkillsChange = (e) => {
    setProfile({ ...profile, skills: e.target.value.split(",").map(s => s.trim()) });
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
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

  // Submit profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateJobseekerProfile(profile);
      setSuccess("Profile updated successfully!");
      setAuth(res.data, res.data.token);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Please fill in all fields");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from current password");
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await changeJobseekerPassword(passwordData.currentPassword, passwordData.newPassword);
      
      setPasswordSuccess(response.data.message || "Password changed successfully! You will be logged out in 3 seconds.");
      
      // Clear password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Auto logout after 3 seconds
      setTimeout(() => {
        localStorage.removeItem("jobConnectUser");
        navigate("/jobseeker/login");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "password"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Jobseeker Profile</h2>
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                name="name"
                label="Full Name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
              <Input
                type="email"
                name="email"
                label="Email Address"
                value={profile.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
              <Input
                type="text"
                name="bio"
                label="Bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
              />
              <Input
                type="text"
                name="skills"
                label="Skills"
                value={profile.skills.join(", ")}
                onChange={handleSkillsChange}
                placeholder="JavaScript, React, Node.js (comma separated)"
              />
              <Input
                type="text"
                name="cv"
                label="CV Link"
                value={profile.cv}
                onChange={handleChange}
                placeholder="Link to your CV or resume"
              />

              <Button type="submit" className="w-full" disabled={profileLoading}>
                {profileLoading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Change Password</h2>
            <p className="text-sm text-gray-500 mb-6">
              Update your password to keep your account secure
            </p>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{passwordSuccess}</p>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your current password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter new password (min. 6 characters)"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-1">
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
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs ${passwordData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ At least 6 characters
                      </span>
                      <span className={`text-xs ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ Uppercase letter
                      </span>
                      <span className={`text-xs ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ Lowercase letter
                      </span>
                      <span className={`text-xs ${/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ Number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword 
                      ? "border-red-300 bg-red-50" 
                      : "border-gray-300"
                  }`}
                  placeholder="Confirm your new password"
                  disabled={passwordLoading}
                />
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
                {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length > 0 && (
                  <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
                )}
              </div>

              {/* Security Note */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  🔒 For security, you will be logged out after changing your password and will need to log in again.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={passwordLoading}>
                {passwordLoading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
