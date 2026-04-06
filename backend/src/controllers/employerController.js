import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import generateToken from "../utils/generateToken.js";
import axios from "axios"; 

// =======================
// Register employer
// =======================
export const createEmployer = async (req, res) => {
  try {
    const { companyName, industry, contactInformation, password, nationality } = req.body;
    const email = contactInformation.email.toLowerCase();

    // 1. STRICTOR NATIONALITY CHECK
    if (!nationality || nationality.toLowerCase() !== 'kenyan') {
      return res.status(403).json({ 
        message: "Registration is restricted to Kenyan nationals only." 
      });
    }

    // 2. GEOLOCATION CHECK (Kenya Only)
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (process.env.NODE_ENV === 'production') {
      try {
        const geoResponse = await axios.get(`http://ip-api.com/json/${userIp}`);
        if (geoResponse.data.status === "success" && geoResponse.data.countryCode !== "KE") {
          return res.status(403).json({ 
            message: "Registration must be completed while physically located in Kenya." 
          });
        }
      } catch (geoError) {
        console.error("Geo check failed, proceeding with caution:", geoError.message);
      }
    }

    // 3. PROCEED WITH REGISTRATION
    const employerExists = await Employer.findOne({ "contactInformation.email": email });
    if (employerExists) return res.status(400).json({ message: "Employer already exists." });

    const employer = await Employer.create({
      companyName,
      industry,
      contactInformation: { ...contactInformation, email },
      password,
      role: "employer", // ✅ Explicitly setting role
      nationality: "Kenyan" 
    });

    res.status(201).json({
      employerId: employer._id,
      role: employer.role, // Returning role for frontend state management
      token: generateToken(employer._id, employer.role, employer._id), // ✅ Passing role to token
    });
  } catch (err) {
    console.error("Reg Error:", err);
    res.status(500).json({ message: "Registration error." });
  }
};

// =======================
// Login employer
// =======================
export const loginEmployer = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();
    
    // Find employer and ensure we have the role
    const employer = await Employer.findOne({ "contactInformation.email": email });
    
    if (!employer || !(await employer.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.status(200).json({
      employerId: employer._id,
      companyName: employer.companyName,
      role: employer.role, // ✅ Returning role
      token: generateToken(employer._id, employer.role, employer._id), // ✅ Passing role to token
    });
  } catch (err) {
    res.status(500).json({ message: "Login error." });
  }
};

// =======================
// Analytics
// =======================
export const getEmployerReports = async (req, res) => {
  try {
    const employerId = req.user?._id; 
    const employerJobIds = await Job.find({ employerId }).distinct("_id");

    const [totalJobs, activeJobs, totalApps, totalInterviews] = await Promise.all([
      Job.countDocuments({ employerId }),
      Job.countDocuments({ employerId, status: "active" }),
      Application.countDocuments({ jobId: { $in: employerJobIds } }),
      Interview.countDocuments({ employerId })
    ]);

    res.status(200).json({
      success: true,
      jobs: { total: totalJobs, active: activeJobs },
      applications: { total: totalApps },
      interviews: { total: totalInterviews },
    });
  } catch (err) {
    res.status(500).json({ message: "Analytics error." });
  }
};

// =======================
// CRUD Operations
// =======================
export const getEmployers = async (req, res) => {
  try {
    const employers = await Employer.find().select("-password");
    res.json(employers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employers." });
  }
};

export const getEmployerById = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id).select("-password");
    if (!employer) return res.status(404).json({ message: "Not found" });
    res.json(employer);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employer." });
  }
};

export const updateEmployer = async (req, res) => {
  try {
    // Note: Use findByIdAndUpdate carefully; it doesn't trigger 'save' middleware (password hashing)
    // if you allow updating passwords here.
    const employer = await Employer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(employer);
  } catch (err) {
    res.status(500).json({ message: "Update error." });
  }
};

export const deleteEmployer = async (req, res) => {
  try {
    await Employer.findByIdAndDelete(req.params.id);
    res.json({ message: "Employer removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete error." });
  }
};

// =======================
// Jobs & Interviews
// =======================
export const getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs." });
  }
};

export const getEmployerInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ employerId: req.user._id })
      .populate("jobId", "title")
      .populate("userId", "name email");
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching interviews." });
  }
};