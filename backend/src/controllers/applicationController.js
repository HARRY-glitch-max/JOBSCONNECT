import mongoose from "mongoose";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import Job from "../models/Job.js";
import Jobseeker from "../models/Jobseeker.js"; 
import { notifyJobseeker } from "../utils/notifyJobseeker.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- 🛡️ Check if user has applied to a specific job ---
export const checkApplicationStatus = async (req, res) => {
  try {
    const { userId, jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    const application = await Application.findOne({ userId, jobId }).select("_id");
    res.status(200).json({ applied: !!application });
  } catch (error) {
    console.error("Error in checkApplicationStatus:", error);
    res.status(500).json({ message: "Server error checking status" });
  }
};

// --- 1. Submit a new application ---
export const createApplication = async (req, res) => {
  try {
    const { jobId, userId, skills, bio } = req.body;

    const existingApp = await Application.findOne({ jobId, userId });
    if (existingApp) {
      return res.status(400).json({ message: "You have already applied for this position." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload your resume (PDF/DOCX)" });
    }

    if (!skills || !bio) {
      return res.status(400).json({ message: "Please provide both your skills and a short bio." });
    }

    const job = await Job.findById(jobId).select("employerId title");
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Cloudinary Upload
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "resumes", resource_type: "raw" },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      );
      stream.end(req.file.buffer);
    });

    const newApp = new Application({
      jobId,
      userId,
      employerId: job.employerId,
      resume: result.secure_url,
      skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()),
      bio,
    });

    await newApp.save();

    // Update Jobseeker profile snapshot
    await Jobseeker.findByIdAndUpdate(userId, { bio, skills: newApp.skills });

    const application = await Application.findById(newApp._id)
      .populate("userId", "name email avatar")
      .populate("jobId", "title");

    if (application.userId?.email) {
      await notifyJobseeker({
        email: application.userId.email,
        name: application.userId.name,
        subject: "Application Successfully Received",
        message: `Thank you for applying for the "${job.title}" position.`,
      });
    }

    res.status(201).json({ message: "Application submitted successfully!", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. Update application status ---
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findByIdAndUpdate(id, { status }, { new: true })
      .populate("userId", "name email avatar")
      .populate("jobId", "title");

    if (!application) return res.status(404).json({ message: "Application not found" });

    await Notification.create({
      userId: application.userId._id,
      type: "application_status",
      content: `Update: Your application status for "${application.jobId.title}" is now ${status}.`,
    });

    res.json({ message: "Status updated", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. Shortlist candidate (FIX: Restored missing export) ---
export const shortlistCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate("userId", "name email avatar")
      .populate("jobId", "title");

    if (!application) return res.status(404).json({ message: "Application not found" });

    application.status = "shortlisted";
    application.shortlistedDate = new Date();
    await application.save();

    await Notification.create({
      userId: application.userId._id,
      type: "application_status",
      content: `Congratulations! You've been shortlisted for "${application.jobId.title}".`,
    });

    res.json({ message: "Candidate shortlisted", application });
  } catch (error) {
    res.status(500).json({ message: "Server error while shortlisting" });
  }
};

// --- 4. Get application by ID (Detailed View) ---
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("userId", "name email avatar bio skills") 
      .populate({
        path: "jobId",
        populate: { path: "employerId", select: "companyName avatar" }
      });
    
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 5. Get applications by User (Jobseeker Side) ---
export const getApplicationsByUser = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "jobId",
        select: "title employerId",
        populate: { path: "employerId", select: "companyName avatar _id" }
      });
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 6. Get applications by Employer (Talent Pipeline View) ---
export const getApplicationsByEmployer = async (req, res) => {
  try {
    const { employerId } = req.params;
    const applications = await Application.find({ employerId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email avatar bio skills") 
      .populate("jobId", "title location type");

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching pipeline" });
  }
};

// --- 7. Get applications by Job ID ---
export const getApplicationsByJob = async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate("userId", "name email avatar bio skills");
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 8. Admin: Get ALL applications (FIX: Restored missing export) ---
export const getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("userId", "name email bio skills")
      .populate("jobId", "title");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 9. Delete Application ---
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json({ message: "Application deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};