import express from "express";
import { 
  registerAdmin, 
  loginAdmin, 
  getAdminReports,
  generateNewReport // ✅ Ensure this is imported from your controller
} from "../controllers/adminController.js";

// ✅ Using your existing middleware
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

// ✅ GET Dashboard Stats
// Full Path: GET /api/admin/reports
router.get("/reports", protect, adminProtect, getAdminReports);

// ✅ POST Generate New Report
// Full Path: POST /api/admin/reports/generate
// This matches the call: axios.post(`${API_URL}/reports/generate`)
router.post("/reports/generate", protect, adminProtect, generateNewReport);

export default router;