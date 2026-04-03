import Admin from "../models/Admin.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";
import Employer from "../models/Employer.js"; // ✅ Added Import
import generateToken from "../utils/generateToken.js";

// ==========================================
// Register admin linked to employer
// ==========================================
export const registerAdmin = async (req, res) => {
  try {
    let { name, email, password, employerId } = req.body;

    if (!name || !email || !password || !employerId) {
      return res.status(400).json({ message: "Please provide name, email, password, and employerId." });
    }

    email = email.toLowerCase();
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists." });
    }

    const admin = await Admin.create({ 
      name, 
      email, 
      password, 
      employerId 
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      employerId: admin.employerId,
      token: generateToken(admin._id, "admin", admin.employerId),
    });
  } catch (error) {
    console.error("REGISTER ADMIN ERROR:", error);
    res.status(500).json({ message: "Server error during admin registration." });
  }
};

// ==========================================
// Login admin
// ==========================================
export const loginAdmin = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Both email and password are required." });
    }

    email = email.toLowerCase();
    const admin = await Admin.findOne({ email }).populate("employerId");

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!admin.employerId) {
      return res.status(404).json({ 
        message: "Admin account found, but linked Employer record is missing." 
      });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      employerId: admin.employerId, 
      token: generateToken(admin._id, "admin", admin.employerId._id),
    });
  } catch (error) {
    console.error("LOGIN ADMIN ERROR:", error);
    res.status(500).json({ message: "Server error during admin login." });
  }
};

// ==========================================
// Generate employer-scoped reports (Live Stats)
// ==========================================
export const getAdminReports = async (req, res) => {
  try {
    const employerId = req.user.employerId; 

    if (!employerId) {
      return res.status(400).json({ message: "Employer ID missing in token authorization." });
    }

    const [
      totalJobs, activeJobs, closedJobs,
      totalApps, shortlistedApps, hiredApps, rejectedApps, pendingApps,
      totalInterviews, completedInterviews, scheduledInterviews, cancelledInterviews
    ] = await Promise.all([
      Job.countDocuments({ employerId }),
      Job.countDocuments({ employerId, status: "active" }),
      Job.countDocuments({ employerId, status: "closed" }),
      Application.countDocuments({ employerId }),
      Application.countDocuments({ employerId, status: "shortlisted" }),
      Application.countDocuments({ employerId, status: "hired" }),
      Application.countDocuments({ employerId, status: "rejected" }),
      Application.countDocuments({ employerId, status: "pending" }),
      Interview.countDocuments({ employerId }),
      Interview.countDocuments({ employerId, status: "completed" }),
      Interview.countDocuments({ employerId, status: "scheduled" }),
      Interview.countDocuments({ employerId, status: "cancelled" })
    ]);

    res.json({
      jobs: { total: totalJobs, active: activeJobs, closed: closedJobs },
      applications: {
        total: totalApps,
        shortlisted: shortlistedApps,
        hired: hiredApps,
        rejected: rejectedApps,
        pending: pendingApps
      },
      interviews: {
        total: totalInterviews,
        completed: completedInterviews,
        scheduled: scheduledInterviews,
        cancelled: cancelledInterviews
      }
    });
  } catch (error) {
    console.error("ADMIN REPORTS ERROR:", error);
    res.status(500).json({ message: "Server error generating dashboard reports." });
  }
};

// ==========================================
// ✅ UPDATED: Trigger New Report Generation & Notify Employer
// ==========================================
export const generateNewReport = async (req, res) => {
  try {
    const employerId = req.user.employerId;
    const adminName = req.user.name; // Extracting name from token via middleware

    if (!employerId) {
      return res.status(400).json({ message: "Employer ID missing." });
    }

    // ✅ Update the Employer document with a notification
    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      {
        $push: {
          notifications: {
            message: `A new real-time hiring report has been generated by Admin: ${adminName}`,
            adminName: adminName,
            createdAt: new Date()
          }
        },
        $set: { lastReportReceived: new Date() }
      },
      { new: true }
    );

    if (!updatedEmployer) {
      return res.status(404).json({ message: "Employer not found to notify." });
    }

    res.status(201).json({ 
      message: "Report generated successfully. AGORO SARE has been notified.",
      generatedAt: new Date()
    });
  } catch (error) {
    console.error("GENERATE REPORT ERROR:", error);
    res.status(500).json({ message: "Failed to process report generation." });
  }
};