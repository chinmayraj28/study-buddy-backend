const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUsername = (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username);

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

router.post("/", async (req, res) => {
    try {
        let { username, email, password } = req.body;

        username = username?.trim();
        email = email?.trim().toLowerCase();
        password = password?.trim();

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Please fill in all fields!" });
        }

        if (!isValidUsername(username)) {
            return res.status(400).json({ error: "Username must be 3-20 characters long and contain only letters, numbers, or underscores." });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid email format!" });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters long, with at least one letter, one number, and one special character." });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: "Email or username is already registered. Try logging in." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ username, email, password: hashedPassword, registeredAt: new Date() });
        await user.save();

        res.json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

module.exports = router;