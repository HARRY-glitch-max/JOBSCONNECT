import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import { notifyJobseeker } from "../utils/sendEmail.js";

/**
 * @desc    Employer books interview slot for a shortlisted candidate
 * @route   POST /api/interviews/book/:jobId
 */
export const bookInterview = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { applicantId, date, time, location } = req.body;
    const employerId = req.user?._id;

    if (!employerId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const application = await Application.findOne({ userId: applicantId, jobId })
      .populate("userId", "name email")
      .populate("jobId", "title");

    if (!application) {
      return res.status(404).json({ message: "Application not found for this candidate." });
    }

    if (application.status !== "shortlisted") {
      return res.status(400).json({ message: "Candidate must be shortlisted before booking." });
    }

    const interview = await Interview.create({
      userId: applicantId,
      jobId,
      employerId,
      date: new Date(date),
      time,
      location,
      status: "scheduled", 
      result: "pending"
    });

    await Notification.insertMany([
      {
        userId: applicantId,
        type: "interview",
        content: `Interview scheduled for ${application.jobId.title} on ${date} at ${location}.`
      },
      {
        userId: employerId,
        type: "interview",
        content: `You booked an interview with ${application.userId.name} for ${application.jobId.title}.`
      }
    ]);

    try {
      await notifyJobseeker({
        email: application.userId.email,
        name: application.userId.name,
        subject: "Interview Scheduled",
        message: `Your interview for ${application.jobId.title} is scheduled on ${date} at ${location}.`,
      });
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

    res.status(201).json({ message: "Interview booked successfully", interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Employer submits interview result (Passed/Failed)
 * @route   PATCH /api/interviews/:id/result
 */
export const submitInterviewResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { result, feedback } = req.body;
    const employerId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const interview = await Interview.findById(id)
      .populate("userId", "name email")
      .populate("jobId", "title");

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this interview." });
    }

    interview.result = result;
    interview.feedback = feedback;
    await interview.save();

    await Notification.create({
      userId: interview.userId._id,
      type: "interview_result",
      content: `Your interview result for ${interview.jobId.title} is: ${result}.`
    });

    try {
      await notifyJobseeker({
        email: interview.userId.email,
        name: interview.userId.name,
        subject: "Interview Result Updated",
        message: `Your result for ${interview.jobId.title} is: ${result}. Feedback: ${feedback || "None provided."}`,
      });
    } catch (emailErr) {
      console.error("Result email failed:", emailErr);
    }

    res.json({ message: "Interview result submitted successfully", interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Employer cancels and deletes an interview
 * @route   DELETE /api/interviews/:id
 */
export const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const employerId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this interview." });
    }

    await Interview.findByIdAndDelete(id);
    res.json({ message: "Interview deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- VIEW CONTROLLERS ---

/**
 * @desc    Fetch all interviews for an Employer (Consolidated Dashboard View)
 * @route   GET /api/interviews/employer/:employerId
 */
export const getInterviewsByEmployer = async (req, res) => {
  try {
    const { employerId } = req.params;

    const interviews = await Interview.find({ employerId })
      .populate("userId", "name email fullName") // Supports different name schemas
      .populate("jobId", "title")
      .sort({ date: 1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employer interviews: " + error.message });
  }
};

export const getInterviewsByJob = async (req, res) => {
  try {
    const interviews = await Interview.find({ jobId: req.params.jobId })
      .populate("userId", "name email fullName")
      .populate("jobId", "title")
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInterviewsByUser = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.params.userId })
      .populate("jobId", "title")
      .populate("employerId", "companyName")
      .sort({ date: 1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate("jobId", "title")
      .populate("userId", "name email fullName")
      .populate("employerId", "companyName email");

    if (!interview) return res.status(404).json({ message: "Interview not found" });
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};