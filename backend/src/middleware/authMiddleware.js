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

      // 2. Optimized Account Fetching
      let account = null;
      const userRole = decoded.role?.toLowerCase();

      // We use .lean() for performance since we don't need Mongoose save() methods here
      if (userRole === "admin") {
        account = await Admin.findById(decoded.id).select("-password").lean();
      } else if (userRole === "employer") {
        account = await Employer.findById(decoded.id).select("-password").lean();
      } else if (userRole === "jobseeker") {
        account = await User.findById(decoded.id).select("-password").lean();
      }

      // Fallback: If role was missing in token (Safety Net)
      if (!account) {
        const [foundUser, foundEmployer, foundAdmin] = await Promise.all([
          User.findById(decoded.id).select("-password").lean(),
          Employer.findById(decoded.id).select("-password").lean(),
          Admin.findById(decoded.id).select("-password").lean(),
        ]);
        account = foundUser || foundEmployer || foundAdmin;
      }

      if (!account) {
        return res.status(401).json({ message: "Account not found or session invalid." });
      }

      // 3. Attach standard user object to request
      // We ensure _id is a string and role is explicitly set
      req.user = {
        ...account,
        _id: account._id.toString(),
        role: userRole || (account.companyName ? "employer" : account.isAdmin ? "admin" : "jobseeker"),
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
  // We check for both "employer" string and existence of companyName as a fallback
  if (req.user && (req.user.role === "employer" || req.user.companyName)) {
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