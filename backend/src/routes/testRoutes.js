import express from "express";
import { notifyJobseeker } from "../utils/sendEmail.js";

const router = express.Router();

router.post("/test-email", async (req, res) => {
  try {
    const { email, name } = req.body;

    await notifyJobseeker({
      email, // ✅ jobseeker email from request
      name,
      subject: "Test Email Notification",
      message: "This is a test notification email from your backend.",
    });

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
