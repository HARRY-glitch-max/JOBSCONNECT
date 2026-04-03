import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import generateToken from "../utils/generateToken.js";

// =======================
// Register employer
// =======================
export const createEmployer = async (req, res) => {
  try {
    const { companyName, industry, contactInformation, password } = req.body;
    const email = contactInformation.email.toLowerCase();
    
    const employerExists = await Employer.findOne({ "contactInformation.email": email });
    if (employerExists) return res.status(400).json({ message: "Employer already exists." });

    const employer = await Employer.create({
      companyName,
      industry,
      contactInformation: { ...contactInformation, email },
      password,
    });

    res.status(201).json({
      employerId: employer._id,
      token: generateToken(employer._id, "employer", employer._id),
    });
  } catch (err) {
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
    const employer = await Employer.findOne({ "contactInformation.email": email });
    
    if (!employer || !(await employer.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.status(200).json({
      employerId: employer._id,
      companyName: employer.companyName,
      token: generateToken(employer._id, "employer", employer._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Login error." });
  }
};

// =======================
// Analytics (FIXES THE UI ERROR)
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
// CRUD Operations (MISSING FUNCTIONS RESTORED)
// =======================
export const getEmployers = async (req, res) => {
  const employers = await Employer.find().select("-password");
  res.json(employers);
};

export const getEmployerById = async (req, res) => {
  const employer = await Employer.findById(req.params.id).select("-password");
  if (!employer) return res.status(404).json({ message: "Not found" });
  res.json(employer);
};

export const updateEmployer = async (req, res) => {
  const employer = await Employer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(employer);
};

export const deleteEmployer = async (req, res) => {
  await Employer.findByIdAndDelete(req.params.id);
  res.json({ message: "Employer removed" });
};

// =======================
// Jobs & Interviews
// =======================
export const getEmployerJobs = async (req, res) => {
  const jobs = await Job.find({ employerId: req.user._id });
  res.json(jobs);
};

export const getEmployerInterviews = async (req, res) => {
  const interviews = await Interview.find({ employerId: req.user._id })
    .populate("jobId", "title")
    .populate("userId", "name email");
  res.json(interviews);
};