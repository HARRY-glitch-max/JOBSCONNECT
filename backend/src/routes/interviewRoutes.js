import express from "express";
import {
  bookInterview,
  getInterviewsByEmployer, // <--- New Import
  getInterviewsByJob,
  getInterviewsByUser,
  getInterviewById,
  submitInterviewResult,
  deleteInterview
} from "../controllers/interviewController.js";
import { protect, employerProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @desc    Schedule a new interview
 * @route   POST /api/interviews/job/:jobId
 * @access  Employer Only
 */
router.post("/job/:jobId", protect, employerProtect, bookInterview);

/**
 * @desc    Fetch all interviews for an Employer (Consolidated Dashboard)
 * @route   GET /api/interviews/employer/:employerId
 * @access  Employer Only
 */
router.get("/employer/:employerId", protect, employerProtect, getInterviewsByEmployer);

/**
 * @desc    Update interview result (Pass/Fail) and add feedback
 * @route   PATCH /api/interviews/:id/result
 * @access  Employer Only
 */
router.patch("/:id/result", protect, employerProtect, submitInterviewResult);

/**
 * @desc    Get all interviews for a specific job
 * @route   GET /api/interviews/job/:jobId
 * @access  Employer/Admin
 */
router.get("/job/:jobId", protect, getInterviewsByJob);

/**
 * @desc    Get all interviews for a specific candidate
 * @route   GET /api/interviews/user/:userId
 * @access  Candidate/Admin
 */
router.get("/user/:userId", protect, getInterviewsByUser);

/**
 * @desc    Get single interview details
 * @route   GET /api/interviews/:id
 * @access  Protected
 */
router.get("/:id", protect, getInterviewById);

/**
 * @desc    Cancel/Delete an interview
 * @route   DELETE /api/interviews/:id
 * @access  Employer Only
 */
router.delete("/:id", protect, employerProtect, deleteInterview);

export default router;