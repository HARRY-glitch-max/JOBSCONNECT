import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import generateToken from "../utils/generateToken.js";
import axios from "axios";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPasswordChangedEmail } from "../utils/sendEmail.js";
import { generateHiringReportPDF } from "../utils/generatePDF.js";

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
// Profile Management
// =======================

/**
 * @desc Get current logged-in employer profile
 */
export const getEmployerProfile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user._id).select("-password -resetPasswordToken -resetPasswordExpire");
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
    delete result.resetPasswordToken;
    delete result.resetPasswordExpire;
    
    res.json(result);
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
};

// =======================
// Password Management
// =======================

/**
 * @desc Change Password (while logged in)
 */
export const changeEmployerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Please provide both current password and new password." 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long." 
      });
    }

    const employer = await Employer.findById(req.user._id);
    if (!employer) {
      return res.status(404).json({ message: "Employer not found." });
    }

    // Verify current password
    const isMatch = await employer.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Set and save new password
    employer.password = newPassword;
    await employer.save();

    // Send confirmation email
    sendPasswordChangedEmail({
      email: employer.contactInformation.email,
      name: employer.companyName,
    }).catch(err => console.error("Failed to send password change confirmation:", err));

    res.json({ 
      message: "Password changed successfully. Please log in again with your new password.",
      shouldLogout: true
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error changing password." });
  }
};

/**
 * @desc Forgot Password - Send Reset Link via Email
 */
export const forgotEmployerPassword = async (req, res) => {
  try {
    let { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Please provide an email address." });
    }

    email = email.toLowerCase();
    const employer = await Employer.findOne({ "contactInformation.email": email });
    
    if (!employer) {
      // For security, don't reveal that email doesn't exist
      return res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token and save to database
    employer.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    employer.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await employer.save({ validateBeforeSave: false });

    // Create reset URL - Using frontend URL for better UX
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}?role=employer`;
    
    try {
      // Use the dedicated password reset email function
      await sendPasswordResetEmail({
        email: employer.contactInformation.email,
        name: employer.companyName,
        resetUrl: resetUrl,
      });

      res.status(200).json({ 
        message: "Password reset link sent to your email address." 
      });
    } catch (emailError) {
      console.error("EMAIL SEND ERROR:", emailError);
      
      // Reset token fields if email fails
      employer.resetPasswordToken = undefined;
      employer.resetPasswordExpire = undefined;
      await employer.save({ validateBeforeSave: false });
      
      res.status(500).json({ 
        message: "Failed to send reset email. Please try again later." 
      });
    }
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error processing forgot password request." });
  }
};

/**
 * @desc Reset Password - Using Token from Email
 */
export const resetEmployerPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please provide a new password." });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long." 
      });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find employer with valid token
    const employer = await Employer.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() } // Token hasn't expired
    });

    if (!employer) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token. Please request a new password reset." 
      });
    }

    // Set new password
    employer.password = password;
    employer.resetPasswordToken = undefined;
    employer.resetPasswordExpire = undefined;
    
    await employer.save();

    // Send confirmation email
    sendPasswordChangedEmail({
      email: employer.contactInformation.email,
      name: employer.companyName,
    }).catch(err => console.error("Failed to send password change confirmation:", err));

    res.json({ 
      message: "Password reset successful. You can now log in with your new password." 
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error resetting password." });
  }
};

// =======================
// Analytics & Reports
// =======================

/**
 * @desc Get employer analytics (JSON)
 */
export const getEmployerReports = async (req, res) => {
  try {
    const employerId = req.user?._id; 
    if (!employerId) return res.status(401).json({ message: "Not authorized" });

    const employerJobIds = await Job.find({ employerId }).distinct("_id");

    const [totalJobs, activeJobs, closedJobs, totalApps, shortlistedApps, hiredApps, rejectedApps, pendingApps, totalInterviews, completedInterviews, scheduledInterviews, cancelledInterviews] = await Promise.all([
      Job.countDocuments({ employerId }),
      Job.countDocuments({ employerId, status: "active" }),
      Job.countDocuments({ employerId, status: "closed" }),
      Application.countDocuments({ jobId: { $in: employerJobIds } }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "shortlisted" }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "hired" }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "rejected" }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "pending" }),
      Interview.countDocuments({ employerId }),
      Interview.countDocuments({ employerId, status: "completed" }),
      Interview.countDocuments({ employerId, status: "scheduled" }),
      Interview.countDocuments({ employerId, status: "cancelled" })
    ]);

    res.status(200).json({
      success: true,
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
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Analytics error." });
  }
};

/**
 * @desc Download hiring report as PDF
 */
export const downloadReportAsPDF = async (req, res) => {
  try {
    const employerId = req.user?._id;
    
    if (!employerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    const employerJobIds = await Job.find({ employerId }).distinct("_id");

    const [totalJobs, activeJobs, closedJobs, totalApps, shortlistedApps, hiredApps, rejectedApps, pendingApps, totalInterviews, completedInterviews, scheduledInterviews, cancelledInterviews] = await Promise.all([
      Job.countDocuments({ employerId }),
      Job.countDocuments({ employerId, status: "active" }),
      Job.countDocuments({ employerId, status: "closed" }),
      Application.countDocuments({ jobId: { $in: employerJobIds } }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "shortlisted" }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "hired" }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "rejected" }),
      Application.countDocuments({ jobId: { $in: employerJobIds }, status: "pending" }),
      Interview.countDocuments({ employerId }),
      Interview.countDocuments({ employerId, status: "completed" }),
      Interview.countDocuments({ employerId, status: "scheduled" }),
      Interview.countDocuments({ employerId, status: "cancelled" })
    ]);

    const reportData = {
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
    };

    // Generate PDF
    const pdfBuffer = await generateHiringReportPDF(reportData, employer.companyName);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=JobConnect_Hiring_Report_${employer.companyName.replace(/\s/g, '_')}_${Date.now()}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
  } catch (err) {
    console.error("PDF Download Error:", err);
    res.status(500).json({ message: "Error generating PDF report", error: err.message });
  }
};

// =======================
// CRUD (Admin/Public)
// =======================

export const getEmployers = async (req, res) => {
  try {
    const employers = await Employer.find().select("-password -resetPasswordToken -resetPasswordExpire");
    res.json(employers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employers." });
  }
};

export const getEmployerById = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id).select("-password -resetPasswordToken -resetPasswordExpire");
    if (!employer) return res.status(404).json({ message: "Not found" });
    res.json(employer);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employer." });
  }
};

// Keep updateEmployer for Admin use (updates by URL ID)
export const updateEmployer = async (req, res) => {
  try {
    const employer = await Employer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire");
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