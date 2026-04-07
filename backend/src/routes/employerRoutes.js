import express from "express";
import {
  createEmployer,
  loginEmployer,
  getEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  getEmployerJobs,
  getEmployerInterviews,
  getEmployerReports,
  updateInterviewStatus, // ✅ Added new controller import
} from "../controllers/employerController.js";
import { shortlistCandidate } from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// 1. PUBLIC AUTH ROUTES
// ==========================================
router.post("/register", createEmployer);
router.post("/login", loginEmployer);

// ==========================================
// 2. PROTECTED EMPLOYER ACTIONS
// ==========================================
// Shortlist a candidate for a specific application
router.put("/applications/:id/shortlist", protect, shortlistCandidate);

// ✅ NEW: Update interview status/result (Pass/Fail)
// Endpoint: PUT /api/employers/interviews/:id/status
router.put("/interviews/:id/status", protect, updateInterviewStatus);

// ==========================================
// 3. ANALYTICS & SPECIFIC COLLECTIONS
// ==========================================
router.get("/reports", protect, getEmployerReports); 
router.get("/jobs", protect, getEmployerJobs);
router.get("/interviews", protect, getEmployerInterviews);

// ==========================================
// 4. GENERAL & DYNAMIC ID ROUTES
// ==========================================
router.get("/", protect, getEmployers);

// Dynamic routes
router.get("/:id", protect, getEmployerById);
router.put("/:id", protect, updateEmployer);
router.delete("/:id", protect, deleteEmployer);

export default router;