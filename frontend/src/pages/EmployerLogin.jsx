// src/pages/EmployerLogin.jsx
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import { loginEmployer } from "../services/api"; // employer-specific login
import { AuthContext } from "../contexts/AuthContext";

export default function EmployerLogin() {
  const navigate = useNavigate();
  const { setAuthUser } = useContext(AuthContext); // use pure setter
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
      const res = await loginEmployer(formData); // hits /api/employers/login
      console.log("Employer login response:", res.data);

      // ✅ Update global AuthContext directly
      setAuthUser({ ...res.data, role: "employer" });

      // ✅ Redirect to employer dashboard (not Home)
      navigate("/employer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-900 shadow-md p-6 rounded-2xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-600 mb-2">Welcome Back</h2>
        <p className="text-slate-500 font-medium">Employer Portal</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-6 font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={handleChange}
          placeholder="company@example.com"
          autoComplete="email"
          required
        />
        <Input
          type="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        
        {/* Forgot Password Link */}
        <div className="text-right">
          <Link 
            to="/forgot-password?role=employer"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        
        <Button 
          type="submit" 
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-100" 
          disabled={loading}
        >
          {loading ? "Verifying..." : "Sign In"}
        </Button>
      </form>
      
      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an employer account?{' '}
          <Link 
            to="/employer/register" 
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
      
      {/* Back to Home Link */}
      <div className="mt-4 text-center">
        <Link 
          to="/" 
          className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}