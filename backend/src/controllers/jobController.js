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
    // ✅ ADDED: deadline from request body
    const { employerId, title, description, requirements, location, salary, deadline } = req.body;
    
    const job = new Job({ 
      employerId, 
      title, 
      description, 
      requirements, 
      location, 
      salary,
      deadline // ✅ Saved to DB
    });

    await job.save();

    await notifyAllJobseekers(
      job,
      "job_posting",
      `A new job "${job.title}" has been posted. Deadline: ${new Date(deadline).toLocaleDateString()}`,
      "New Job Alert"
    );

    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    // ✅ OPTIONAL: Filter out jobs that are already expired
    const now = new Date();
    const jobs = await Job.find({ deadline: { $gt: now } })
      .populate("employerId", "companyName industry");
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobsByEmployer = async (req, res) => {
  try {
    // Employers usually want to see ALL their jobs, including expired ones
    const jobs = await Job.find({ employerId: req.params.employerId })
      .populate("employerId", "companyName industry");
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("employerId", "companyName industry");
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    // Attach the virtual 'isExpired' check in the response
    const jobData = job.toObject({ virtuals: true });
    res.json(jobData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("employerId", "companyName");
    
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
// Interview Routes
// =======================

export const scheduleInterview = async (req, res) => {
  const { jobId } = req.params;
  const { applicantId, date, time, locationLink } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // ✅ Create interview record
    const interview = await Interview.create({ 
      jobId, 
      applicantId, 
      date, 
      time,
      location: locationLink || "Office/Online" 
    });

    const applicant = await User.findById(applicantId);
    if (applicant) {
      await Notification.create({
        userId: applicant._id,
        type: "interview",
        content: `Interview scheduled for "${job.title}" on ${date} at ${time}. Location: ${locationLink || 'Not specified'}`,
      });

      await notifyJobseeker({
        email: applicant.email,
        name: applicant.name,
        subject: "Interview Scheduled",
        message: `You have an interview scheduled for "${job.title}" on ${date} at ${time}. Please be prepared!`,
      });
    }

    res.status(201).json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to schedule interview" });
  }
};

export const getInterviewsForJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const interviews = await Interview.find({ jobId })
      .populate("applicantId", "name email");
    res.status(200).json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};