const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Lab = require("../models/Lab");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { getJwtSecret } = require("../utils/jwt");
const { ROLES, normalizeRole } = require("../utils/roles");

const router = express.Router();
const VALID_ROLES = Object.values(ROLES);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role) || user.role,
});

const validateDoctorSignup = ({ specialization, experience, location, fees }) => {
  if (!specialization || experience === undefined || !location || fees === undefined) {
    return "Doctor signup requires specialization, experience, location, and fees";
  }

  if (Number.isNaN(Number(experience)) || Number(experience) < 0) {
    return "Doctor experience must be a valid positive number";
  }

  if (Number.isNaN(Number(fees)) || Number(fees) < 0) {
    return "Doctor fees must be a valid positive number";
  }

  return null;
};

// Signup
router.post("/signup", async (req, res) => {
  let createdUser = null;

  try {
    const { name, email, password, role, specialization, experience, location, fees, profileImage } = req.body;

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

    const selectedRole = normalizeRole(role || ROLES.PATIENT);
    if (!VALID_ROLES.includes(selectedRole)) {
      return res.status(400).json({ error: "Invalid user role selected" });
    }

    // Restrict public signup to patients only
    if (selectedRole !== "patient") {
      return res.status(403).json({ error: "Only admins can create doctor or staff accounts. Please sign up as a patient." });
    }

    if (selectedRole === "doctor") {
      const doctorSignupError = validateDoctorSignup({
        specialization,
        experience,
        location,
        fees,
      });

      if (doctorSignupError) {
        return res.status(400).json({ error: doctorSignupError });
      }
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
    createdUser = user;

    if (selectedRole === "doctor") {
      const doctorProfile = new Doctor({
        userId: user._id,
        email: normalizedEmail,
        name: name.trim(),
        specialization: specialization.trim(),
        experience: Number(experience),
        location: location.trim(),
        fees: Number(fees),
      });

      await doctorProfile.save();
    }

    res.status(201).json({
      message: "User created successfully",
      user: formatUserResponse(user),
    });
  } catch (error) {
    if (createdUser?._id) {
      await User.findByIdAndDelete(createdUser._id).catch(() => null);
    }

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

// Super Admin route to create managed user accounts
router.post("/admin/create-user", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  let createdUser = null;
  try {
    const { name, email, password, role, specialization, experience, location, fees, profileImage } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const selectedRole = normalizeRole(role);
    if (!VALID_ROLES.includes(selectedRole)) {
      return res.status(400).json({ error: "Invalid user role selected" });
    }

    if (selectedRole === "doctor") {
      const doctorSignupError = validateDoctorSignup({
        specialization,
        experience,
        location,
        fees,
      });

      if (doctorSignupError) {
        return res.status(400).json({ error: doctorSignupError });
      }
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
    createdUser = user;

    if (selectedRole === "doctor") {
      const doctorProfile = new Doctor({
        userId: user._id,
        email: normalizedEmail,
        name: name.trim(),
        specialization: specialization.trim(),
        experience: Number(experience),
        location: location.trim(),
        fees: Number(fees),
        profileImage: profileImage?.trim() || "",
      });
      await doctorProfile.save();
    }

    if (selectedRole === ROLES.LABORATORY) {
      const labProfile = new Lab({
        userId: user._id,
        email: normalizedEmail,
        name: name.trim(),
        location: location?.trim() || "TBD",
      });
      await labProfile.save();
    }

    console.info("admin_action", {
      action: "create_user",
      actorId: req.user.id,
      targetUserId: String(user._id),
      role: selectedRole,
    });

    res.status(201).json({ message: "User created successfully", user: formatUserResponse(user) });
  } catch (error) {
    if (createdUser?._id) {
      await User.findByIdAndDelete(createdUser._id).catch(() => null);
    }
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
