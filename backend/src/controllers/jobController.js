// controllers/jobController.js
import Job from "../models/Job.js";
import Notification from "../models/Notification.js";
import User from "../models/Jobseeker.js"; 
import Interview from "../models/Interview.js";
import { notifyJobseeker } from "../utils/notifyJobseeker.js";

// =======================
// Helper: Notify all jobseekers (Optimized)
// =======================
const notifyAllJobseekers = async (job, type, message, subject) => {
  try {
    const jobseekers = await User.find({}, "name email");
    
    // Promise.all handles multiple notifications in parallel
    await Promise.all(jobseekers.map(async (seeker) => {
      await Notification.create({
        userId: seeker._id,
        type,
        content: message,
        link: `/jobs/${job._id}`
      });

      return notifyJobseeker({
        email: seeker.email,
        name: seeker.name,
        subject,
        message,
      });
    }));
  } catch (error) {
    console.error("NOTIFICATION_HELPER_ERROR:", error);
  }
};

// =======================
// Job Routes
// =======================

export const createJob = async (req, res) => {
  try {
    const { employerId, title, description, requirements, location, salary } = req.body;
    const job = new Job({ employerId, title, description, requirements, location, salary });
    await job.save();

    await notifyAllJobseekers(
      job,
      "job_posting",
      `A new job "${job.title}" has been posted.`,
      "New Job Alert"
    );

    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("employerId", "companyName industry");
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobsByEmployer = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.params.employerId }).populate("employerId", "companyName industry");
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("employerId", "companyName industry");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("employerId", "companyName");
    if (!job) return res.status(404).json({ message: "Job not found" });

    await notifyAllJobseekers(job, "job_update", `Job "${job.title}" has been updated.`, "Job Update");
    res.json({ message: "Job updated successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    await notifyAllJobseekers(job, "job_delete", `Job "${job.title}" was removed.`, "Job Removed");
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Interview Routes (The Missing Functions)
// =======================

export const scheduleInterview = async (req, res) => {
  const { jobId } = req.params;
  const { applicantId, date, time } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const interview = await Interview.create({ jobId, applicantId, date, time });

    const applicant = await User.findById(applicantId);
    if (applicant) {
      await Notification.create({
        userId: applicant._id,
        type: "interview",
        content: `Interview scheduled for "${job.title}" on ${date} at ${time}.`,
      });

      await notifyJobseeker({
        email: applicant.email,
        name: applicant.name,
        subject: "Interview Scheduled",
        message: `You have an interview scheduled for "${job.title}" on ${date} at ${time}.`,
      });
    }

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: "Failed to schedule interview" });
  }
};

export const getInterviewsForJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const interviews = await Interview.find({ jobId }).populate("applicantId", "name email");
    res.status(200).json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};