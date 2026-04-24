const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const VALID_ROLES = ["patient", "doctor"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const getJwtSecret = () => process.env.JWT_SECRET || "replace-this-in-production";

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const selectedRole = role || "patient";
    if (!VALID_ROLES.includes(selectedRole)) {
      return res.status(400).json({ error: "Invalid user role selected" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: selectedRole,
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: formatUserResponse(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    res.status(400).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
