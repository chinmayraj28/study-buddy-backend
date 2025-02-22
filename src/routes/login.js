const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/", [
        body("email").trim().isEmail().withMessage("Invalid email format"),
        body("password").trim().isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: "Invalid email or password." });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid email or password." });
            }

            const token = jwt.sign(
                { id: user._id, email: user.email, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );

            res.json({ message: "Login successful!", token });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: "Server error. Please try again later." });
        }
    }
);

module.exports = router;
