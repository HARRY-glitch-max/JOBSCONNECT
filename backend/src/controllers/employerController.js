import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import generateToken from "../utils/generateToken.js";
import axios from "axios";

// =======================
// Auth & Identity
// =======================

/**
 * @desc Register employer (Kenyan Only + Geo-fencing)
 */
export const createEmployer = async (req, res) => {
  try {
    const { companyName, industry, contactInformation, password, nationality } = req.body;
    const email = contactInformation.email.toLowerCase();

    if (!nationality || nationality.toLowerCase() !== 'kenyan') {
      return res.status(403).json({ 
        message: "Registration is restricted to Kenyan nationals only." 
      });
    }

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

    const employerExists = await Employer.findOne({ "contactInformation.email": email });
    if (employerExists) return res.status(400).json({ message: "Employer already exists." });

    const employer = await Employer.create({
      companyName,
      industry,
      contactInformation: { ...contactInformation, email },
      password,
      role: "employer", 
      nationality: "Kenyan" 
    });

    res.status(201).json({
      employerId: employer._id,
      role: employer.role, 
      token: generateToken(employer._id, employer.role), 
    });
  } catch (err) {
    console.error("Reg Error:", err);
    res.status(500).json({ message: "Registration error." });
  }
};

/**
 * @desc Login employer
 */
export const loginEmployer = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();
    
    const employer = await Employer.findOne({ "contactInformation.email": email });
    
    if (!employer || !(await employer.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.status(200).json({
      employerId: employer._id,
      companyName: employer.companyName,
      role: employer.role, 
      token: generateToken(employer._id, employer.role), 
    });
  } catch (err) {
    res.status(500).json({ message: "Login error." });
  }
};

// =======================
// Profile Management (NEW)
// =======================

/**
 * @desc Get current logged-in employer profile
 */
export const getEmployerProfile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user._id).select("-password");
    if (!employer) return res.status(404).json({ message: "Employer not found" });
    res.json(employer);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile." });
  }
};

/**
 * @desc Update current logged-in employer profile
 */
export const updateEmployerProfile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user._id);
    if (!employer) return res.status(404).json({ message: "Employer not found" });

    // Update top-level fields
    employer.companyName = req.body.companyName || employer.companyName;
    employer.industry = req.body.industry || employer.industry;

    // Update nested contactInformation
    if (req.body.contactInformation) {
      employer.contactInformation = {
        email: req.body.contactInformation.email?.toLowerCase() || employer.contactInformation.email,
        phone: req.body.contactInformation.phone || employer.contactInformation.phone,
        address: req.body.contactInformation.address || employer.contactInformation.address,
      };
    }

    if (req.body.password) {
      employer.password = req.body.password;
    }

    const updatedEmployer = await employer.save();
    
    // Return sanitized object
    const result = updatedEmployer.toObject();
    delete result.password;
    
    res.json(result);
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
};

// =======================
// Analytics
// =======================

export const getEmployerReports = async (req, res) => {
  try {
    const employerId = req.user?._id; 
    if (!employerId) return res.status(401).json({ message: "Not authorized" });

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
// CRUD (Admin/Public)
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

// Keep updateEmployer for Admin use (updates by URL ID)
export const updateEmployer = async (req, res) => {
  try {
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
    const employerId = req.user?._id;
    if (!employerId) return res.status(401).json({ message: "Employer ID not found in session." });

    const jobs = await Job.find({ employerId });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs." });
  }
};

export const getEmployerInterviews = async (req, res) => {
  try {
    const employerId = req.user?._id;
    if (!employerId) return res.status(401).json({ message: "Not authorized to view interviews." });

    const interviews = await Interview.find({ employerId })
      .populate("jobId", "title")
      .populate("userId", "name email") 
      .sort({ date: 1 });
    
    res.json(interviews);
  } catch (err) {
    console.error("Fetch Interviews Error:", err);
    res.status(500).json({ message: "Error fetching interviews." });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params; 
    const { result, status, feedback } = req.body;

    const updatedInterview = await Interview.findByIdAndUpdate(
      id,
      { result, status, feedback },
      { new: true }
    ).populate("userId", "name email").populate("jobId", "title");

    if (!updatedInterview) {
      return res.status(404).json({ message: "Interview not found." });
    }

    res.status(200).json({ 
      success: true, 
      message: `Candidate marked as ${result}`, 
      data: updatedInterview 
    });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Error updating interview status." });
  }
};