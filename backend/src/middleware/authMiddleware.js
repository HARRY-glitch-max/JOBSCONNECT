import jwt from "jsonwebtoken";
import User from "../models/Jobseeker.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";

/**
 * 🛡️ Global Protection Middleware
 * Verifies JWT and attaches the correct user object + role to the request.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // 1. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 2. Optimized Account Fetching based on Decoded Role
      let account = null;
      const userRole = decoded.role?.toLowerCase();

      if (userRole === "admin") {
        account = await Admin.findById(decoded.id).select("-password").lean();
      } else if (userRole === "employer") {
        account = await Employer.findById(decoded.id).select("-password").lean();
      } else if (userRole === "jobseeker") {
        account = await User.findById(decoded.id).select("-password").lean();
      } else {
        // Fallback: If role is missing in token, check all (Safety Net)
        const [foundUser, foundEmployer] = await Promise.all([
          User.findById(decoded.id).select("-password").lean(),
          Employer.findById(decoded.id).select("-password").lean(),
        ]);
        account = foundUser || foundEmployer;
      }

      if (!account) {
        return res.status(401).json({ message: "Account not found or session invalid." });
      }

      // 3. Attach User, Role, and critical IDs to Request Object
      // ✅ FIX: Explicitly mapping properties to ensure 'lean' objects work with controllers
      req.user = {
        ...account,
        _id: account._id.toString(),
        role: userRole || (account.companyName ? "employer" : "jobseeker"),
        // ✅ CRITICAL: Ensure employerId is passed for the reports controller
        employerId: account.employerId ? account.employerId.toString() : decoded.employerId,
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

/**
 * Restricts access to Admin users only
 */
export const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admins only." });
};

/**
 * Restricts access to Employer users only
 */
export const employerProtect = (req, res, next) => {
  if (req.user && req.user.role === "employer") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Employers only." });
};

/**
 * Restricts access to Jobseekers only
 */
export const jobseekerProtect = (req, res, next) => {
  if (req.user && req.user.role === "jobseeker") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Jobseekers only." });
};