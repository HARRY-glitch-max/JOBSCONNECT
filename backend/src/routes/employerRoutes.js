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
  getEmployerProfile,         // ✅ Self profile
  updateEmployerProfile,      // ✅ Self profile update
  changeEmployerPassword,     // ✅ Logged-in password change
  forgotEmployerPassword,     // ✅ Fixed: Changed from 'forgotPassword' to 'forgotEmployerPassword'
  resetEmployerPassword       // ✅ Fixed: Changed from 'resetPassword' to 'resetEmployerPassword'
} from "../controllers/employerController.js";

import { shortlistCandidate } from "../controllers/applicationController.js";
import { protect, employerProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// 1. PUBLIC AUTH ROUTES
// ==========================================
router.post("/register", createEmployer);
router.post("/login", loginEmployer);

/**
 * @route   POST /api/employers/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post("/forgot-password", forgotEmployerPassword);

/**
 * @route   PATCH /api/employers/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.patch("/reset-password/:token", resetEmployerPassword);

// ==========================================
// 2. PERSONAL PROFILE ROUTES (MUST BE ABOVE /:id)
// ==========================================
// These handle the logged-in employer's own data via token
router.get("/profile/me", protect, employerProtect, getEmployerProfile);
router.put("/profile/me", protect, employerProtect, updateEmployerProfile);

/**
 * @route   PUT /api/employers/change-password
 * @desc    Change password while logged in
 * @access  Private
 */
router.put("/change-password", protect, employerProtect, changeEmployerPassword);

// ==========================================
// 3. PROTECTED EMPLOYER ACTIONS
// ==========================================
// Shortlist a candidate for a specific application
router.put("/applications/:id/shortlist", protect, employerProtect, shortlistCandidate);

// Update interview status/result (Pass/Fail)
router.put("/interviews/:id/status", protect, employerProtect, updateInterviewStatus);

// ==========================================
// 4. ANALYTICS & SPECIFIC COLLECTIONS
// ==========================================
router.get("/reports", protect, employerProtect, getEmployerReports); 
router.get("/jobs", protect, employerProtect, getEmployerJobs);
router.get("/interviews", protect, employerProtect, getEmployerInterviews);

// ==========================================
// 5. GENERAL & DYNAMIC ID ROUTES
// ==========================================
router.get("/", protect, getEmployers);

// Dynamic routes (Keep these at the bottom)
router.get("/:id", protect, getEmployerById);
router.put("/:id", protect, updateEmployer);
router.delete("/:id", protect, deleteEmployer);

export default router;