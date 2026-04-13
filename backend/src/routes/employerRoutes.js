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
  updateInterviewStatus,
  getEmployerProfile,    // ✅ Added for the new profile logic
  updateEmployerProfile, // ✅ Added for the new profile logic
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
// 2. PERSONAL PROFILE ROUTES (MUST BE ABOVE /:id)
// ==========================================
// These handle the logged-in employer's own data via token
router.get("/profile/me", protect, getEmployerProfile);
router.put("/profile/me", protect, updateEmployerProfile);

// ==========================================
// 3. PROTECTED EMPLOYER ACTIONS
// ==========================================
// Shortlist a candidate for a specific application
router.put("/applications/:id/shortlist", protect, shortlistCandidate);

// Update interview status/result (Pass/Fail)
router.put("/interviews/:id/status", protect, updateInterviewStatus);

// ==========================================
// 4. ANALYTICS & SPECIFIC COLLECTIONS
// ==========================================
router.get("/reports", protect, getEmployerReports); 
router.get("/jobs", protect, getEmployerJobs);
router.get("/interviews", protect, getEmployerInterviews);

// ==========================================
// 5. GENERAL & DYNAMIC ID ROUTES
// ==========================================
router.get("/", protect, getEmployers);

// Dynamic routes (Keep these at the bottom)
router.get("/:id", protect, getEmployerById);
router.put("/:id", protect, updateEmployer);
router.delete("/:id", protect, deleteEmployer);

export default router;