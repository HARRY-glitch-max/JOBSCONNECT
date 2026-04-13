import jwt from "jsonwebtoken";
import User from "../models/Jobseeker.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";

/**
 * 🛡️ Global Protection Middleware
 * Verifies JWT and attaches the correct user object + normalized role.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // 1. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 2. Optimized Account Fetching
      let account = null;
      let detectedRole = decoded.role?.toLowerCase();

      // We use .lean() for performance
      if (detectedRole === "admin") {
        account = await Admin.findById(decoded.id).select("-password").lean();
      } else if (detectedRole === "employer") {
        account = await Employer.findById(decoded.id).select("-password").lean();
      } else if (detectedRole === "jobseeker") {
        account = await User.findById(decoded.id).select("-password").lean();
      }

      // 3. Fallback: If role was missing or account not found in primary collection
      if (!account) {
        const [foundUser, foundEmployer, foundAdmin] = await Promise.all([
          User.findById(decoded.id).select("-password").lean(),
          Employer.findById(decoded.id).select("-password").lean(),
          Admin.findById(decoded.id).select("-password").lean(),
        ]);
        
        if (foundUser) { account = foundUser; detectedRole = "jobseeker"; }
        else if (foundEmployer) { account = foundEmployer; detectedRole = "employer"; }
        else if (foundAdmin) { account = foundAdmin; detectedRole = "admin"; }
      }

      if (!account) {
        return res.status(401).json({ message: "Account not found or session invalid." });
      }

      // 4. Attach standard user object to request
      // ✅ FIX: Explicitly adding .id so controllers using req.user.id don't return 404
      req.user = {
        ...account,
        _id: account._id.toString(),
        id: account._id.toString(), 
        role: account.role || detectedRole, 
      };

      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      
      const errorMessage = error.name === "TokenExpiredError" 
        ? "Session expired, please login again." 
        : "Not authorized, token failed.";
        
      return res.status(401).json({ message: errorMessage });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token provided." });
  }
};

// ==========================================
// 🔒 Granular Role Protection Middlewares
// ==========================================

export const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Access denied: Admins only." });
};

export const employerProtect = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (req.user && (role === "employer" || req.user.companyName)) return next();
  return res.status(403).json({ message: "Access denied: Employers only." });
};

export const jobseekerProtect = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (req.user && role === "jobseeker") return next();
  return res.status(403).json({ message: "Access denied: Jobseekers only." });
};