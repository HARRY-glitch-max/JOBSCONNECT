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
    res.status(500).json({ message: "Server error checking status" });
  }
};

// --- 1. Submit a new application ---
export const createApplication = async (req, res) => {
  try {
    const { jobId, userId, skills, bio } = req.body;
    const existingApp = await Application.findOne({ jobId, userId });
    if (existingApp) return res.status(400).json({ message: "Already applied." });

    if (!req.file) return res.status(400).json({ message: "Please upload your resume." });
    if (!skills || !bio) return res.status(400).json({ message: "Skills and bio required." });

    const job = await Job.findById(jobId).select("employerId title");
    if (!job) return res.status(404).json({ message: "Job not found" });

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
    await Jobseeker.findByIdAndUpdate(userId, { bio, skills: newApp.skills });

    const application = await Application.findById(newApp._id)
      .populate("userId", "name email")
      .populate("jobId", "title");

    if (application.userId?.email) {
      await notifyJobseeker({
        email: application.userId.email,
        name: application.userId.name,
        subject: "Application Received",
        message: `Thank you for applying for "${job.title}".`,
      });
    }

    res.status(201).json({ message: "Application submitted!", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. Update status (Hire/Reject/Interview) ---
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    const application = await Application.findByIdAndUpdate(
      id, 
      { status, finalFeedback: feedback }, 
      { new: true }
    )
      .populate("userId", "name email")
      .populate("jobId", "title");

    if (!application) return res.status(404).json({ message: "Application not found" });

    // 1. Create Dashboard Notification
    let content = `Update: Your application status for "${application.jobId.title}" is now ${status}.`;
    if (status === "hired") content = `Congratulations! You have been HIRED for "${application.jobId.title}"!`;
    if (status === "unsuccessful") content = `Update: Your application for "${application.jobId.title}" was not successful at this time.`;

    await Notification.create({
      userId: application.userId._id,
      type: "application_status",
      content,
    });

    // 2. Automated Email
    try {
      await notifyJobseeker({
        email: application.userId.email,
        name: application.userId.name,
        subject: status === "hired" ? "Job Offer Received!" : "Application Update",
        message: content + (feedback ? ` Feedback: ${feedback}` : ""),
      });
    } catch (err) {
      console.error("Email failed:", err);
    }

    res.json({ message: `Application marked as ${status}`, application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. Shortlist candidate ---
export const shortlistCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate("userId", "name email")
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

// --- View & Helper Controllers (Keep as they were) ---

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
  } catch (error) { res.status(500).json({ message: error.message }); }
};

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

export const getApplicationsByEmployer = async (req, res) => {
  try {
    const { employerId } = req.params;
    const applications = await Application.find({ employerId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email avatar bio skills") 
      .populate("jobId", "title location type");
    res.status(200).json(applications);
  } catch (error) { res.status(500).json({ message: "Server error fetching pipeline" }); }
};

export const getApplicationsByJob = async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate("userId", "name email avatar bio skills");
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("userId", "name email bio skills")
      .populate("jobId", "title");
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json({ message: "Application deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};