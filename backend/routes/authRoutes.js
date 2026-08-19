const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Lab = require("../models/Lab");
const Clinic = require("../models/Clinic");

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/auth");

const { getJwtSecret } = require("../utils/jwt");
const { ROLES, normalizeRole } = require("../utils/roles");

const router = express.Router();

const VALID_ROLES = Object.values(ROLES);

// Fixed email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =====================================================
// FORMAT USER RESPONSE
// =====================================================

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role) || user.role,
});

// =====================================================
// VALIDATE DOCTOR DATA
// =====================================================

const validateDoctorSignup = ({
  specialization,
  experience,
  location,
  fees,
}) => {
  if (
    !specialization ||
    experience === undefined ||
    !location ||
    fees === undefined
  ) {
    return "Doctor signup requires specialization, experience, location, and fees";
  }

  if (
    Number.isNaN(Number(experience)) ||
    Number(experience) < 0
  ) {
    return "Doctor experience must be a valid positive number";
  }

  if (
    Number.isNaN(Number(fees)) ||
    Number(fees) < 0
  ) {
    return "Doctor fees must be a valid positive number";
  }

  return null;
};

// =====================================================
// VALIDATE CLINIC ASSIGNMENT
// =====================================================

const validateClinic = async (clinicId) => {
  if (!clinicId) {
    return {
      error: null,
      clinic: null,
    };
  }

  const clinic = await Clinic.findById(clinicId);

  if (!clinic) {
    return {
      error: "Selected clinic was not found",
      clinic: null,
    };
  }

  if (clinic.isActive === false) {
    return {
      error: "Selected clinic is inactive",
      clinic: null,
    };
  }

  return {
    error: null,
    clinic,
  };
};

// =====================================================
// SIGNUP
// =====================================================

router.post("/signup", async (req, res) => {
  let createdUser = null;

  try {
    const {
      name,
      email,
      password,
      role,
      specialization,
      experience,
      location,
      fees,
      profileImage,
      clinicId,
    } = req.body;

    // -------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const selectedRole = normalizeRole(
      role || ROLES.PATIENT
    );

    if (!VALID_ROLES.includes(selectedRole)) {
      return res.status(400).json({
        error: "Invalid user role selected",
      });
    }

    // -------------------------------------------------
    // PUBLIC SIGNUP = PATIENT ONLY
    // -------------------------------------------------

    if (selectedRole !== ROLES.PATIENT) {
      return res.status(403).json({
        error:
          "Only admins can create doctor or staff accounts. Please sign up as a patient.",
      });
    }

    // -------------------------------------------------
    // DUPLICATE EMAIL
    // -------------------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error:
          "An account with this email already exists",
      });
    }

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: selectedRole,
    });

    await user.save();

    createdUser = user;

    // -------------------------------------------------
    // DOCTOR PROFILE
    // -------------------------------------------------

    if (selectedRole === ROLES.DOCTOR) {
      const doctorSignupError =
        validateDoctorSignup({
          specialization,
          experience,
          location,
          fees,
        });

      if (doctorSignupError) {
        await User.findByIdAndDelete(user._id);

        return res.status(400).json({
          error: doctorSignupError,
        });
      }

      const clinicValidation =
        await validateClinic(clinicId);

      if (clinicValidation.error) {
        await User.findByIdAndDelete(user._id);

        return res.status(400).json({
          error: clinicValidation.error,
        });
      }

      const doctorProfile = new Doctor({
        userId: user._id,
        email: normalizedEmail,
        name: name.trim(),
        specialization: specialization.trim(),
        experience: Number(experience),
        location: location.trim(),
        fees: Number(fees),
        profileImage:
          profileImage?.trim() || "",

        // IMPORTANT
        clinic: clinicId || null,

        clinics: clinicId
          ? [clinicId]
          : [],
      });

      await doctorProfile.save();
    }

    return res.status(201).json({
      message: "User created successfully",
      user: formatUserResponse(user),
    });
  } catch (error) {
    if (createdUser?._id) {
      await User.findByIdAndDelete(
        createdUser._id
      ).catch(() => null);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error:
          "An account with this email already exists",
      });
    }

    console.error("Signup error:", error);

    return res.status(400).json({
      error: error.message,
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isMatch =
      await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const normalizedUserRole =
      normalizeRole(user.role) || user.role;

    const token = jwt.sign(
      {
        id: user._id,
        role: normalizedUserRole,
      },
      getJwtSecret(),
      {
        expiresIn: "1h",
      }
    );

    res.json({
      token,

      user: {
        ...formatUserResponse(user),

        // Useful for staff frontend
        clinicId: user.clinicId || null,
        doctorId: user.doctorId || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// =====================================================
// SUPER ADMIN CREATE USER
// POST /api/auth/admin/create-user
// =====================================================

router.post(
  "/admin/create-user",
  authenticateUser,
  authorizeRoles(ROLES.SUPER_ADMIN),
  async (req, res) => {
    let createdUser = null;
    let createdDoctor = null;
    let createdLab = null;

    try {
      const {
        name,
        email,
        password,
        role,

        // Doctor fields
        specialization,
        experience,
        location,
        fees,
        profileImage,

        // IMPORTANT
        clinicId,
        clinics,
        department,
      } = req.body;

      // -------------------------------------------------
      // BASIC VALIDATION
      // -------------------------------------------------

      if (
        !name ||
        !email ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          error:
            "Name, email, password, and role are required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({
          error:
            "Please provide a valid email address",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error:
            "Password must be at least 6 characters long",
        });
      }

      const selectedRole =
        normalizeRole(role);

      if (!VALID_ROLES.includes(selectedRole)) {
        return res.status(400).json({
          error:
            "Invalid user role selected",
        });
      }

      // -------------------------------------------------
      // DUPLICATE EMAIL
      // -------------------------------------------------

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          error:
            "An account with this email already exists",
        });
      }

      // -------------------------------------------------
      // DOCTOR VALIDATION
      // -------------------------------------------------

      if (
        selectedRole === ROLES.DOCTOR
      ) {
        const doctorSignupError =
          validateDoctorSignup({
            specialization,
            experience,
            location,
            fees,
          });

        if (doctorSignupError) {
          return res.status(400).json({
            error: doctorSignupError,
          });
        }

        // ---------------------------------------------
        // VALIDATE SELECTED CLINIC
        // ---------------------------------------------

        const clinicValidation =
          await validateClinic(
            clinicId || null
          );

        if (clinicValidation.error) {
          return res.status(400).json({
            error:
              clinicValidation.error,
          });
        }
      }

      // -------------------------------------------------
      // CREATE USER
      // -------------------------------------------------

      const user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: selectedRole,
      });

      await user.save();

      createdUser = user;

      // =================================================
      // CREATE DOCTOR PROFILE
      // =================================================

      if (
        selectedRole === ROLES.DOCTOR
      ) {
        // Normalize clinics array
        let doctorClinics = [];

        if (Array.isArray(clinics)) {
          doctorClinics =
            clinics.filter(Boolean);
        }

        // Add selected primary clinic
        if (
          clinicId &&
          !doctorClinics.some(
            (id) =>
              String(id) ===
              String(clinicId)
          )
        ) {
          doctorClinics.push(
            clinicId
          );
        }

        const doctorProfile =
          new Doctor({
            userId: user._id,

            email: normalizedEmail,

            name: name.trim(),

            specialization:
              specialization.trim(),

            experience:
              Number(experience),

            location:
              location.trim(),

            fees: Number(fees),

            profileImage:
              profileImage?.trim() || "",

            // =========================================
            // IMPORTANT CLINIC ASSIGNMENT
            // =========================================

            clinic:
              clinicId || null,

            clinics:
              doctorClinics,

            // =========================================
            // DEPARTMENT
            // =========================================

            department:
              department || null,
          });

        await doctorProfile.save();

        createdDoctor =
          doctorProfile;
      }

      // =================================================
      // CREATE LAB PROFILE
      // =================================================

      if (
        selectedRole ===
        ROLES.LABORATORY
      ) {
        const labProfile =
          new Lab({
            userId: user._id,
            email: normalizedEmail,
            name: name.trim(),
            location:
              location?.trim() ||
              "TBD",
          });

        await labProfile.save();

        createdLab = labProfile;
      }

      // =================================================
      // ADMIN ACTION LOG
      // =================================================

      console.info(
        "admin_action",
        {
          action: "create_user",
          actorId: req.user.id,
          targetUserId:
            String(user._id),
          role: selectedRole,

          ...(createdDoctor
            ? {
                doctorId:
                  String(
                    createdDoctor._id
                  ),
              }
            : {}),

          ...(clinicId
            ? {
                clinicId:
                  String(clinicId),
              }
            : {}),
        }
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({
        message:
          "User created successfully",

        user: formatUserResponse(user),

        ...(createdDoctor
          ? {
              doctor: {
                id: createdDoctor._id,
                name:
                  createdDoctor.name,
                clinic:
                  createdDoctor.clinic,
                clinics:
                  createdDoctor.clinics,
              },
            }
          : {}),
      });
    } catch (error) {
      // -----------------------------------------------
      // CLEANUP USER
      // -----------------------------------------------

      if (createdUser?._id) {
        await User.findByIdAndDelete(
          createdUser._id
        ).catch(() => null);
      }

      // -----------------------------------------------
      // CLEANUP DOCTOR
      // -----------------------------------------------

      if (createdDoctor?._id) {
        await Doctor.findByIdAndDelete(
          createdDoctor._id
        ).catch(() => null);
      }

      // -----------------------------------------------
      // CLEANUP LAB
      // -----------------------------------------------

      if (createdLab?._id) {
        await Lab.findByIdAndDelete(
          createdLab._id
        ).catch(() => null);
      }

      if (error.code === 11000) {
        return res.status(409).json({
          error:
            "An account with this email already exists",
        });
      }

      console.error(
        "Admin create user error:",
        error
      );

      return res.status(400).json({
        error:
          error.message ||
          "Failed to create user",
      });
    }
  }
);

module.exports = router;