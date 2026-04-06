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
// Middleware 'protect' ensures a valid JWT is present before proceeding
router.put("/applications/:id/shortlist", protect, shortlistCandidate);

// ==========================================
// 3. ANALYTICS & SPECIFIC COLLECTIONS
// ==========================================
// IMPORTANT: These must sit ABOVE the "/:id" routes to avoid route hijacking
router.get("/reports", protect, getEmployerReports); 
router.get("/jobs", protect, getEmployerJobs);
router.get("/interviews", protect, getEmployerInterviews);

// ==========================================
// 4. GENERAL & DYNAMIC ID ROUTES
// ==========================================
// Fetch all employers (Admin/Internal use)
router.get("/", protect, getEmployers);

// Dynamic routes - these catch any single string following /api/employers/
router.get("/:id", protect, getEmployerById);
router.put("/:id", protect, updateEmployer);
router.delete("/:id", protect, deleteEmployer);

export default router;