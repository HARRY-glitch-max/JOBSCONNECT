import express from "express";
import { 
  registerAdmin, 
  loginAdmin, 
  getAdminReports,
  generateNewReport,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,   // ✅ Added for logged-in password changes
  forgotPassword,        // ✅ Added for initiating reset
  resetPassword          // ✅ Added for completing reset
} from "../controllers/adminController.js";

import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// 1. Public Auth Routes (No Token Required)
// ==========================================
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/**
 * @route   POST /api/admin/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   PATCH /api/admin/reset-password/:token
 * @desc    Reset password using the token from email
 * @access  Public
 */
router.patch("/reset-password/:token", resetPassword);

// ==========================================
// 2. Protected Admin-Only Routes (Token Required)
// ==========================================

/**
 * @route   PUT /api/admin/change-password
 * @desc    Change password while logged in
 * @access  Private/Admin
 */
router.put("/change-password", protect, adminProtect, changeAdminPassword);

/**
 * @route   GET & PUT /api/admin/profile/me
 * @desc    Get or Update current admin profile
 * @access  Private/Admin
 */
router.route("/profile/me")
  .get(protect, adminProtect, getAdminProfile)
  .put(protect, adminProtect, updateAdminProfile);

/**
 * @route   GET /api/admin/reports
 * @desc    Get Dashboard Stats
 * @access  Private/Admin
 */
router.get("/reports", protect, adminProtect, getAdminReports);

/**
 * @route   POST /api/admin/reports/generate
 * @desc    Generate New Report
 * @access  Private/Admin
 */
router.post("/reports/generate", protect, adminProtect, generateNewReport);

export default router;
