// src/pages/EmployerLogin.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="max-w-md mx-auto mt-10 bg-white shadow-md p-6 rounded">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Employer Login</h2>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          autoComplete="email"             // ✅ valid autocomplete
          required
        />
        <Input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          autoComplete="current-password"  // ✅ valid autocomplete
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
