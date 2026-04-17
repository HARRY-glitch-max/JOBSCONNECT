// src/pages/AdminProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/button";
import { getAdminProfile, updateAdminProfile } from "../services/api"; // ✅ API layer
import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";

export default function AdminProfile() {
  const navigate = useNavigate();
  const { login: setAuth } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    employerId: "",
    role: "admin",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getAdminProfile(); // ✅ calls /api/admin/profile
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await updateAdminProfile(profile); // ✅ calls PUT /api/admin/profile
      setSuccess("Profile updated successfully!");
      // refresh auth context if needed
      setAuth(res.data, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (error && !success) return <p>{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-md p-6 rounded">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Admin Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <Input
          type="email"
          name="email"
          value={profile.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <Input
          type="text"
          name="employerId"
          value={profile.employerId}
          onChange={handleChange}
          placeholder="Employer ID"
          required
        />
        <Button type="submit" className="w-full">
          Update Profile
        </Button>
      </form>

      {success && <p className="text-green-600 text-sm mt-4">{success}</p>}
      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
    </div>
  );
}
