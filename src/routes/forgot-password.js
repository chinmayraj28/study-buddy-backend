const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const router = express.Router();

// Fixed password validation function with more comprehensive checks
const isValidPassword = (password) => {
  // Check minimum length
  if (password.length < 8) return false;
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) return false;
  
  // Check for at least one digit
  if (!/\d/.test(password)) return false;
  
  // Check for at least one special character - expanded character set
  if (!/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  return true;
};

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required!" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "User with this email does not exist." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 900000;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "Gmail", 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click the link below to reset your password:
            
            ${process.env.CLIENT_URL}/#/forgot-password?token=${resetToken}
            
            This link will expire in 15 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Password reset link sent to your email." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

router.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Password is required!" });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long, with at least one letter, one number, and one special character."
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: "Password has been reset successfully." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

module.exports = router;