import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, Phone, MapPin, Briefcase, Save, ShieldCheck, Loader2 } from "lucide-react";
import { getEmployerProfile, updateEmployerProfile } from "../services/api"; 
import { AuthContext } from "../contexts/AuthContext";
import Button from "../components/ui/Button";

export default function EmployerProfile() {
  const { login: setAuth } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    companyName: "",
    industry: "",
    contactInformation: {
      email: "",
      phone: "",
      address: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getEmployerProfile();
        // Defensive check: Ensure contactInformation exists in the response
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await updateEmployerProfile(profile);
      setSuccess("Cloud Profile Synchronized Successfully!");
      
      // Update AuthContext so the Sidebar/Header updates in real-time
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

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 font-black uppercase tracking-widest text-xs">
      <Loader2 className="animate-spin mr-2" size={18} /> Syncing HireFlow Data...
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
      </div>
    </motion.div>
  );
}