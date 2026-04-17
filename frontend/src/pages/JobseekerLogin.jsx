import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import { loginJobseeker } from "../services/api"; 
import { AuthContext } from "../contexts/AuthContext";

export default function JobseekerLogin() {
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
      const res = await loginJobseeker(formData);
      
      // 1. Log the response to verify structure (token should be a string)
      console.log("Jobseeker login success:", res.data);

      // 2. Format the data precisely for your interceptor
      // We ensure the token is at the top level of this object
      const userToSave = {
        ...res.data, // This likely includes user object + token string
        role: "jobseeker",
        _id: res.data.user?._id || res.data._id // Handle different backend response shapes
      };

      // 3. CRITICAL: Clean up stale/malformed data
      // This removes the "token" key that was causing the 'Bearer undefined' error
      localStorage.removeItem("token");
      
      // 4. PERSIST: Save the new unified object
      localStorage.setItem("jobConnectUser", JSON.stringify(userToSave));

      // 5. STATE: Update global context
      setAuthUser(userToSave);

      // 6. REDIRECT
      navigate("/jobseeker/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-900 shadow-md p-6 rounded-2xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-blue-600 mb-2">Welcome Back</h2>
        <p className="text-slate-500 font-medium">Jobseeker Portal</p>
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
          placeholder="name@example.com"
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
        <Button 
          type="submit" 
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-100" 
          disabled={loading}
        >
          {loading ? "Verifying..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}