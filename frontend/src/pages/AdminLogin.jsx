// src/pages/AdminLogin.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/button";
import { loginAdmin } from "../services/api"; 
import { AuthContext } from "../contexts/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAuthUser } = useContext(AuthContext); 
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginAdmin(formData);
      
      // 1. ✅ PERSIST THE TOKEN
      // This is the most important step. Your API helpers look here!
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      // 2. ✅ UPDATE GLOBAL STATE
      // We spread res.data.user (or res.data) and force the role to admin
      // Ensure the structure matches what your AuthContext expects
      setAuthUser({ 
        ...res.data.user, 
        role: "admin",
        token: res.data.token 
      });

      // 3. ✅ REDIRECT
      navigate("/admin/dashboard");
      
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white shadow-xl shadow-blue-500/5 p-8 rounded-[2rem] border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h2>
          <p className="text-slate-500 font-medium mt-2">Enter your credentials to manage HireFlow</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold mb-6 border border-rose-100 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@hireflow.com"
              autoComplete="email"
              required
              className="rounded-xl border-slate-200 focus:border-blue-500 h-12"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="rounded-xl border-slate-200 focus:border-blue-500 h-12"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-200 mt-4" 
            disabled={loading}
          >
            {loading ? "Verifying..." : "Sign In to Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}