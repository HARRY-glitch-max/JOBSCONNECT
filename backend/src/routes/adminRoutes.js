import express from "express";
import { 
  registerAdmin, 
  loginAdmin, 
  getAdminReports,
  generateNewReport,
  getAdminProfile,
  updateAdminProfile
} from "../controllers/adminController.js";

import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// 1. Public Auth Routes
// ==========================================
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// ==========================================
// 2. Protected Admin-Only Routes
// ==========================================

/**
 * @route   GET & PUT /api/admin/profile/me
 * @desc    Get or Update current admin profile
 * @access  Private/Admin
 */
router.route("/profile/me")
  .get(protect, adminProtect, getAdminProfile)
  .put(protect, adminProtect, updateAdminProfile);

// ✅ GET Dashboard Stats
// Full Path: GET /api/admin/reports
router.get("/reports", protect, adminProtect, getAdminReports);

// ✅ POST Generate New Report
// Full Path: POST /api/admin/reports/generate
router.post("/reports/generate", protect, adminProtect, generateNewReport);

export default router;