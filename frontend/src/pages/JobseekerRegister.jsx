// src/pages/JobseekerRegister.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/button";
import { registerJobseeker } from "../services/api"; 
import { AuthContext } from "../contexts/AuthContext";

export default function JobseekerRegister() {
  const navigate = useNavigate();
  const { login: setAuth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    nationality: "Kenyan", // ✅ Added nationality with default value
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ✅ Frontend Guard: Check nationality before sending to backend
    if (formData.nationality !== "Kenyan") {
      setError("Registration is restricted to Kenyan nationals.");
      setLoading(false);
      return;
    }

    try {
      const res = await registerJobseeker(formData); 
      localStorage.setItem("jobConnectUser", JSON.stringify(res.data));
      setAuth(res.data, res.data.token);

      navigate("/jobseeker/dashboard");
    } catch (err) {
      // ✅ Captures errors like "Already exists" or the IP location block
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-md p-6 rounded">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Jobseeker Register</h2>
      
      {/* Enhanced Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full Name"
          required
        />
        
        {/* ✅ Nationality Selector */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700 ml-1">Nationality</label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            required
          >
            <option value="Kenyan">Kenyan</option>
            <option value="Other">Other (Not Supported)</option>
          </select>
          {formData.nationality !== "Kenyan" && (
            <p className="text-xs text-red-500 mt-1">
              JobsConnect is exclusive to Kenyans.
            </p>
          )}
        </div>

        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <Input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || formData.nationality !== "Kenyan"}
        >
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>
    </div>
  );
}