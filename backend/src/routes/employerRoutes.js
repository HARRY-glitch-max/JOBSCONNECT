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
  getEmployerReports, // ✅ Imported correctly
} from "../controllers/employerController.js";
import { shortlistCandidate } from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. PUBLIC AUTH ROUTES
router.post("/register", createEmployer);
router.post("/login", loginEmployer);

// 2. EMPLOYER-SPECIFIC ACTIONS
// Handles shortlisting for applicants like those seen in your "Active Applicants" count
router.put("/applications/:id/shortlist", protect, shortlistCandidate);

// 3. EMPLOYER DATA & ANALYTICS
// ✅ Priority routes to prevent CastErrors for 'reports', 'jobs', etc.
router.get("/reports", protect, getEmployerReports); 
router.get("/jobs", protect, getEmployerJobs);
router.get("/interviews", protect, getEmployerInterviews);

// 4. GENERAL COLLECTION ROUTES
router.get("/", protect, getEmployers);

// 5. DYNAMIC ID ROUTES (Always keep these at the bottom)
router.get("/:id", protect, getEmployerById);
router.put("/:id", protect, updateEmployer);
router.delete("/:id", protect, deleteEmployer);

export default router;