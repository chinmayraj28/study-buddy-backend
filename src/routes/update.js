const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.put("/update-user", async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: "Username already exists. Try a different username." });
            }
            user.username = username;
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ error: "Email already exists. Try a different email." });
            }
            user.email = email;
        }

        await user.save();
        
        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "User settings updated successfully!", token });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

router.put("/change-password", async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid password." });
        }
        if (oldPassword === newPassword) {
            return res.status(400).json({ error: "New password must be different from the old password." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Password updated successfully!", token });
    } catch (error) {
        console.error("Password update error:", error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

module.exports = router;
