import express from "express";
import { 
  registerAdmin, 
  loginAdmin, 
  getAdminReports 
} from "../controllers/adminController.js";
// ✅ Import BOTH protect (global) and adminProtect (role-specific)
import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Public Auth Routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// 2. Protected Admin-Only Routes
// 🚩 CRITICAL: 'protect' MUST come before 'adminProtect'
router.get("/reports", protect, adminProtect, getAdminReports);

export default router;