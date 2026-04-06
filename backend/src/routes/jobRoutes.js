import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobsByEmployer,
  scheduleInterview,      // ✅ Updated to match controller
  getInterviewsForJob      // ✅ Updated to match controller
} from "../controllers/jobController.js";

// ✅ Middleware to handle JWT verification and Role checking
import { protect, employerProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// 1. PUBLIC JOB ROUTES
// ==========================================
// Anyone can view the job listings and individual job details
router.get("/", getJobs);
router.get("/:id", getJobById);

// ==========================================
// 2. EMPLOYER PROTECTED JOB MANAGEMENT
// ==========================================
// Specific routes for an employer to see their own posted jobs
router.get("/employer/:employerId", protect, employerProtect, getJobsByEmployer);

// CRUD operations for jobs - Only authenticated employers can create/edit/delete
router.post("/", protect, employerProtect, createJob);
router.put("/:id", protect, employerProtect, updateJob);
router.delete("/:id", protect, employerProtect, deleteJob);

// ==========================================
// 3. INTERVIEW MANAGEMENT (Scoped to Job)
// ==========================================

/**
 * @route   POST /api/jobs/:jobId/interviews
 * @desc    Schedule a new interview for a specific job
 * @access  Private (Employer only)
 */
router.post("/:jobId/interviews", protect, employerProtect, scheduleInterview);

/**
 * @route   GET /api/jobs/:jobId/interviews
 * @desc    Get all interviews associated with a specific job
 * @access  Private (Employer only)
 */
router.get("/:jobId/interviews", protect, employerProtect, getInterviewsForJob);

export default router;