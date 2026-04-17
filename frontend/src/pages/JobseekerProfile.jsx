// src/pages/JobseekerProfile.jsx
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/button";
import { getJobseekerProfile, updateJobseekerProfile } from "../services/api"; // ✅ API layer
import { AuthContext } from "../contexts/AuthContext";

export default function JobseekerProfile() {
  const navigate = useNavigate();
  const { login: setAuth } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    skills: [],
    cv: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getJobseekerProfile(); // ✅ calls /api/jobseekers/profile
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
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSkillsChange = (e) => {
    setProfile({ ...profile, skills: e.target.value.split(",") });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await updateJobseekerProfile(profile); // ✅ calls PUT /api/jobseekers/:id
      setSuccess("Profile updated successfully!");
      setAuth(res.data, res.data.token); // refresh auth context if token returned
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (error && !success) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-md p-6 rounded">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Jobseeker Profile</h2>
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
          name="bio"
          value={profile.bio}
          onChange={handleChange}
          placeholder="Bio"
        />
        <Input
          type="text"
          name="skills"
          value={profile.skills.join(",")}
          onChange={handleSkillsChange}
          placeholder="Skills (comma separated)"
        />
        <Input
          type="text"
          name="cv"
          value={profile.cv}
          onChange={handleChange}
          placeholder="CV link or file reference"
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
