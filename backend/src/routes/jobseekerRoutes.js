import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,          // Admin/General update
  updateUserProfile,   // Self update
  deleteUser,
  getUserProfile,
  notifyJobseekerById,
  changeUserPassword,      // ✅ Fixed: Changed from 'changePassword' to 'changeUserPassword'
  forgotUserPassword,      // ✅ Fixed: Changed from 'forgotPassword' to 'forgotUserPassword'
  resetUserPassword        // ✅ Fixed: Changed from 'resetPassword' to 'resetUserPassword'
} from "../controllers/jobseekerController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// 1. AUTH ROUTES (Public)
// ==========================================
router.post("/register", registerUser);
router.post("/login", loginUser);

/**
 * @route   POST /api/jobseekers/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post("/forgot-password", forgotUserPassword);

/**
 * @route   PATCH /api/jobseekers/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.patch("/reset-password/:token", resetUserPassword);

// ==========================================
// 2. PROTECTED PROFILE ROUTES (Token Required)
// ==========================================
router.route("/profile/me")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

/**
 * @route   PUT /api/jobseekers/change-password
 * @desc    Change password while logged in
 * @access  Private
 */
router.put("/change-password", protect, changeUserPassword);

// ==========================================
// 3. JOBSEEKER COLLECTION ROUTES
// ==========================================
router.get("/", getUsers);

// ==========================================
// 4. JOBSEEKER ID ROUTES (Wildcards)
// ==========================================
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// ==========================================
// 5. JOBSEEKER NOTIFICATION ROUTE
// ==========================================
router.post("/notify/:id", notifyJobseekerById);

export default router;