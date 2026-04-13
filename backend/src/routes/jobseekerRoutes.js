import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,          // Admin/General update
  updateUserProfile,   // Added: Self update
  deleteUser,
  getUserProfile,
  notifyJobseekerById
} from "../controllers/jobseekerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. AUTH ROUTES
router.post("/register", registerUser);
router.post("/login", loginUser);

// 2. PROTECTED PROFILE ROUTES (Must be ABOVE /:id)
// These use the user ID from the token (req.user._id)
router.route("/profile/me")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile); // Fully enables the 'Update' feature

// 3. JOBSEEKER COLLECTION ROUTES
router.get("/", getUsers);

// 4. JOBSEEKER ID ROUTES (The "Wildcards")
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// 5. JOBSEEKER NOTIFICATION ROUTE
router.post("/notify/:id", notifyJobseekerById);

export default router;