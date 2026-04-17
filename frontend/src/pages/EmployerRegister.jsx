// src/pages/EmployerRegister.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import { registerEmployer } from "../services/api"; 
import { AuthContext } from "../contexts/AuthContext";

export default function EmployerRegister() {
  const navigate = useNavigate();
  const { login: setAuth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    contactInformation: {
      email: "",
      phone: "",
      address: "",
    },
    password: "",
    nationality: "Kenyan", // ✅ Added nationality with default value
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["email", "phone", "address"].includes(name)) {
      setFormData({
        ...formData,
        contactInformation: {
          ...formData.contactInformation,
          [name]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ✅ Frontend Guard: Ensure nationality is Kenyan before hitting the API
    if (formData.nationality !== "Kenyan") {
      setError("Registration is restricted to Kenyan nationals.");
      setLoading(false);
      return;
    }

    try {
      const res = await registerEmployer(formData); 
      localStorage.setItem("jobConnectUser", JSON.stringify(res.data));
      setAuth(res.data, res.data.token);

      navigate("/employer/dashboard");
    } catch (err) {
      // ✅ This will now catch the "Not in Kenya" IP block from your backend
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-md p-6 rounded">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Employer Register</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          placeholder="Company Name"
          required
        />
        <Input
          type="text"
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          placeholder="Industry"
          required
        />
        
        {/* ✅ Nationality Selector */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Nationality</label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="Kenyan">Kenyan</option>
            <option value="Other">Other (Not Supported)</option>
          </select>
          {formData.nationality !== "Kenyan" && (
            <p className="text-xs text-red-500 mt-1">
              JobsConnect is exclusive to Kenya.
            </p>
          )}
        </div>

        <Input
          type="email"
          name="email"
          value={formData.contactInformation.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <Input
          type="text"
          name="phone"
          value={formData.contactInformation.phone}
          onChange={handleChange}
          placeholder="Phone"
        />
        <Input
          type="text"
          name="address"
          value={formData.contactInformation.address}
          onChange={handleChange}
          placeholder="Address"
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