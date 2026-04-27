import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, Phone, MapPin, Briefcase, Save, ShieldCheck, Loader2, Key, Eye, EyeOff } from "lucide-react";
import { getEmployerProfile, updateEmployerProfile, changeEmployerPassword } from "../services/api"; 
import { AuthContext } from "../contexts/AuthContext";
import Button from "../components/ui/button";

export default function EmployerProfile() {
  const { login: setAuth, logout } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    companyName: "",
    industry: "",
    contactInformation: {
      email: "",
      phone: "",
      address: "",
    },
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
        const res = await getEmployerProfile();
        const data = res.data;
        if (!data.contactInformation) {
          data.contactInformation = { email: "", phone: "", address: "" };
        }
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["email", "phone", "address"].includes(name)) {
      setProfile((prev) => ({
        ...prev,
        contactInformation: {
          ...prev.contactInformation,
          [name]: value,
        },
      }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
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
      const res = await updateEmployerProfile(profile);
      setSuccess("Cloud Profile Synchronized Successfully!");
      
      if (res.data) {
        setAuth(res.data, res.data.token || localStorage.getItem("token"));
      }
      
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to push updates to server");
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
      const response = await changeEmployerPassword(passwordData.currentPassword, passwordData.newPassword);
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
        window.location.href = "/employer/login";
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

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 font-black uppercase tracking-widest text-xs">
      <Loader2 className="animate-spin mr-2" size={18} /> Syncing JobConnect Data...
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] border border-slate-100">
        
        {/* Header Widget */}
        <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
          <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200 shrink-0">
            {profile.companyName?.charAt(0) || "H"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Organization Settings</h2>
               <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100">
                  <ShieldCheck size={12} /> Verified Employer
               </div>
            </div>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">Manage your company's digital footprint and contact preferences.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-4 px-4 font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`pb-4 px-4 font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Key size={16} /> Change Password
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <>
            {/* Feedback Messages */}
            {(success || error) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-8 p-6 rounded-2xl font-bold text-sm border ${
                  success ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                {success || error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              
              <div className="space-y-6 md:col-span-2 mb-2">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Corporate Profile</p>
                 <hr className="border-slate-100" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Company Legal Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    name="companyName" 
                    value={profile.companyName} 
                    onChange={handleChange} 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Industry Sector</label>
                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    name="industry" 
                    value={profile.industry} 
                    onChange={handleChange} 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-6 md:col-span-2 mt-6 mb-2">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Point of Contact</p>
                 <hr className="border-slate-100" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Official Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    name="email" 
                    type="email"
                    value={profile.contactInformation.email} 
                    onChange={handleChange} 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Corporate Phone</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    name="phone" 
                    value={profile.contactInformation.phone} 
                    onChange={handleChange} 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900" 
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Headquarters Physical Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input 
                    name="address" 
                    value={profile.contactInformation.address} 
                    onChange={handleChange} 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900" 
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-8">
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className={`w-full py-6 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl ${
                    saving ? "bg-slate-100 text-slate-400" : "bg-[#0A0F1D] text-white hover:bg-blue-600 hover:shadow-blue-200"
                  }`}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Deploy Profile Changes</>}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key size={32} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Change Password</h3>
              <p className="text-slate-500 mt-2">Update your password to keep your account secure</p>
            </div>

            {passwordSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-medium text-sm border border-emerald-100"
              >
                {passwordSuccess}
              </motion.div>
            )}

            {passwordError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-2xl font-medium text-sm border border-rose-100"
              >
                {passwordError}
              </motion.div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Current Password</label>
                <div className="relative group">
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-14 pr-14 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900" 
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">New Password</label>
                <div className="relative group">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-14 pr-14 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900" 
                    placeholder="Enter new password (min. 6 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                      <span className="text-xs font-medium text-slate-500">
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-xs ${passwordData.newPassword.length >= 6 ? 'text-green-600' : 'text-slate-400'}`}>
                        ✓ At least 6 characters
                      </span>
                      <span className={`text-xs ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                        ✓ Uppercase
                      </span>
                      <span className={`text-xs ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                        ✓ Lowercase
                      </span>
                      <span className={`text-xs ${/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                        ✓ Number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Confirm New Password</label>
                <div className="relative group">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full pl-14 pr-14 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900 ${
                      passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword 
                        ? "ring-2 ring-red-300" 
                        : ""
                    }`}
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="mt-2 text-xs text-red-500 ml-4">Passwords do not match</p>
                )}
              </div>

              {/* Security Note */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-800">
                  🔒 For security, you will be logged out after changing your password and will need to log in again.
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={passwordLoading} 
                className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${
                  passwordLoading ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {passwordLoading ? <Loader2 className="animate-spin" size={20} /> : <Key size={20} />}
                {passwordLoading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}