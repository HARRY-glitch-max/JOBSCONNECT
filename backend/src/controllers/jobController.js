// controllers/jobController.js
import Job from "../models/Job.js";
import Notification from "../models/Notification.js";
import User from "../models/Jobseeker.js"; 
import Interview from "../models/Interview.js";
import { notifyJobseeker } from "../utils/sendEmail.js";

// =======================
// Helper: Notify all jobseekers
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
    const { employerId, title, description, requirements, location, salary, deadline } = req.body;
    
    const job = new Job({ 
      employerId, 
      title, 
      description, 
      requirements, 
      location, 
      salary,
      deadline 
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
// Interview Routes (UPDATED)
// =======================

export const scheduleInterview = async (req, res) => {
  const { jobId } = req.params;
  
  // ✅ FIX: Extracting 'userId' and 'employerId' to match the Interview Schema
  const { userId, employerId, date, time, location } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // ✅ FIX: Saving with field names that match your mongoose.model("Interview")
    const interview = await Interview.create({ 
      jobId, 
      userId,      
      employerId,  
      date, 
      time,
      location: location || "Office/Online",
      status: "scheduled"
    });

    const applicant = await User.findById(userId);
    if (applicant) {
      await Notification.create({
        userId: applicant._id,
        type: "interview",
        content: `Interview scheduled for "${job.title}" on ${new Date(date).toLocaleDateString()} at ${time}. Location: ${location || 'Not specified'}`,
      });

      await notifyJobseeker({
        email: applicant.email,
        name: applicant.name,
        subject: "Interview Scheduled",
        message: `You have an interview scheduled for "${job.title}" on ${new Date(date).toLocaleDateString()} at ${time}. Please be prepared!`,
      });
    }

    res.status(201).json(interview);
  } catch (error) {
    console.error("SCHEDULE_INTERVIEW_ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to schedule interview" });
  }
};

export const getInterviewsForJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    // ✅ FIX: Populating 'userId' instead of 'applicantId'
    const interviews = await Interview.find({ jobId })
      .populate("userId", "name email");
    res.status(200).json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};