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
  getEmployerProfile,
  updateEmployerProfile,
  changeEmployerPassword,
  forgotEmployerPassword,
  resetEmployerPassword,
  downloadReportAsPDF
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
router.get("/profile/me", protect, employerProtect, getEmployerProfile);
router.put("/profile/me", protect, employerProtect, updateEmployerProfile);
router.put("/change-password", protect, employerProtect, changeEmployerPassword);

// ==========================================
// 3. PROTECTED EMPLOYER ACTIONS
// ==========================================
router.put("/applications/:id/shortlist", protect, employerProtect, shortlistCandidate);
router.put("/interviews/:id/status", protect, employerProtect, updateInterviewStatus);

// ==========================================
// 4. ANALYTICS & REPORTS ROUTES
// ==========================================
router.get("/reports", protect, employerProtect, getEmployerReports);
router.get("/reports/download", protect, employerProtect, downloadReportAsPDF);
router.get("/jobs", protect, employerProtect, getEmployerJobs);
router.get("/interviews", protect, employerProtect, getEmployerInterviews);

// ==========================================
// 5. GENERAL COLLECTION ROUTE
// ==========================================
router.get("/", protect, getEmployers);

// ==========================================
// 6. DYNAMIC ID ROUTES (MUST BE LAST)
// ==========================================
router.get("/:id", protect, getEmployerById);
router.put("/:id", protect, updateEmployer);
router.delete("/:id", protect, deleteEmployer);

// ==========================================
// 7. DEBUG ROUTE - Check all registered routes (remove in production)
// ==========================================
if (process.env.NODE_ENV !== 'production') {
  router.get("/debug/routes", (req, res) => {
    const routes = [];
    router.stack.forEach(layer => {
      if (layer.route) {
        routes.push({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods)
        });
      }
    });
    res.json({ routes });
  });
}

export default router;