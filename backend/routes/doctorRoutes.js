const router = require("express").Router();
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");
const { getJwtSecret } = require("../utils/jwt");
const { ROLES, normalizeRole, hasRole } = require("../utils/roles");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const optionalAuthenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next();
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.id);

    if (user) {
      req.user = {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role) || user.role,
      };
    }

    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const canManageDoctor = (user, doctor) => {
  if (!user || !doctor) {
    return false;
  }

  if (hasRole(user, ROLES.SUPER_ADMIN)) {
    return true;
  }

  return (
    user.role === "doctor" &&
    (String(doctor.userId || "") === user.id || doctor.email === user.email)
  );
};

const validateDoctorPayload = ({ name, specialization, experience, location, fees }) => {
  if (!name || !specialization || experience === undefined || !location || fees === undefined) {
    return "All doctor fields are required";
  }

  if (Number.isNaN(Number(experience)) || Number(experience) < 0) {
    return "Experience must be a valid positive number";
  }

  if (Number.isNaN(Number(fees)) || Number(fees) < 0) {
    return "Fees must be a valid positive number";
  }

  return null;
};

router.get("/", optionalAuthenticateUser, async (req, res) => {
  try {
    const filters = {};
    const {
      search,
      specialty,
      city,
      department,
      consultationType,
      availableToday,
      minRating,
      userId,
      email,
      minExperience,
      maxExperience,
      minFees,
      maxFees,
    } = req.query;

    // If the user is a doctor, they can only see their own profile.
    if (req.user?.role === "doctor") {
      filters.$and = [
        { isActive: { $ne: false } },
        { $or: [{ userId: req.user.id }, { email: req.user.email }] },
      ];
    } else {
      // For other roles or public access, build filters from query params.
      const andConditions = [{ isActive: { $ne: false } }];

      // This handles cases for dashboards (e.g., DoctorDashboard) needing a specific profile.
      if (userId && email) {
        andConditions.push({ $or: [{ userId }, { email: email.trim().toLowerCase() }] });
      } else if (userId) {
        andConditions.push({ userId });
      } else if (email) {
        andConditions.push({ email: email.trim().toLowerCase() });
      }

      // Filters for the public directory page
      if (specialty && specialty !== "all") {
        andConditions.push({ specialization: specialty });
      }
      if (city && city !== "all") {
        andConditions.push({ location: city });
      }
      if (department && department !== "all") {
        andConditions.push({ department });
      }
      if (consultationType && consultationType !== "all") {
        andConditions.push({ consultationType });
      }
      if (availableToday === "true") {
        const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
        andConditions.push({
          availability: {
            $elemMatch: {
              day: today,
              isAvailable: true,
            },
          },
        });
      }
      if (search) {
        const searchRegex = new RegExp(search.trim(), "i");
        andConditions.push({
          $or: [
            { name: searchRegex },
            { qualification: searchRegex },
            { specialization: searchRegex },
            { location: searchRegex },
            { shortDescription: searchRegex },
            { about: searchRegex },
            { treatmentsOffered: searchRegex },
            { diseasesTreated: searchRegex },
            { "hospitalClinicDetails.hospitalName": searchRegex },
            { "hospitalClinicDetails.clinicName": searchRegex },
            { "hospitalClinicDetails.clinicAddress": searchRegex },
            { "hospitalClinicDetails.services": searchRegex },
          ],
        });
      }

      const experienceRange = {};
      if (minExperience !== undefined && minExperience !== "") {
        experienceRange.$gte = Number(minExperience);
      }
      if (maxExperience !== undefined && maxExperience !== "") {
        experienceRange.$lte = Number(maxExperience);
      }
      if (Object.keys(experienceRange).length) {
        if (Object.values(experienceRange).some((value) => Number.isNaN(value) || value < 0)) {
          return res.status(400).json({ error: "Experience filters must be positive numbers" });
        }
        andConditions.push({ experience: experienceRange });
      }

      const feeRange = {};
      if (minFees !== undefined && minFees !== "") {
        feeRange.$gte = Number(minFees);
      }
      if (maxFees !== undefined && maxFees !== "") {
        feeRange.$lte = Number(maxFees);
      }
      if (Object.keys(feeRange).length) {
        if (Object.values(feeRange).some((value) => Number.isNaN(value) || value < 0)) {
          return res.status(400).json({ error: "Fee filters must be positive numbers" });
        }
        andConditions.push({ fees: feeRange });
      }

      if (minRating !== undefined && minRating !== "") {
        const ratingValue = Number(minRating);
        if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
          return res.status(400).json({ error: "Rating filter must be between 0 and 5" });
        }
        andConditions.push({ rating: { $gte: ratingValue } });
      }

      if (andConditions.length > 0) {
        filters.$and = andConditions;
      }
    }

    const doctors = await Doctor.find(filters)
      .populate("hospital", "name city address")
      .populate("hospitals", "name city address")
      .populate("clinic", "name city address")
      .populate("clinics", "name city address")
      .populate("department", "name")
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all unique specializations for filter dropdowns
router.get("/specialties", async (_req, res) => {
  try {
    const specialties = await Doctor.distinct("specialization");
    res.json(specialties.filter(Boolean)); // Filter out null/empty values
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all unique locations (cities) for filter dropdowns
router.get("/locations", async (_req, res) => {
  try {
    const locations = await Doctor.distinct("location");
    res.json(locations.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.id, isActive: { $ne: false } })
      .populate("hospital", "name city address")
      .populate("hospitals", "name city address")
      .populate("clinic", "name city address")
      .populate("clinics", "name city address")
      .populate("department", "name");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.json(doctor);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid doctor ID format" });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const validationError = validateDoctorPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const doctor = new Doctor({
      email: req.body.email?.trim().toLowerCase() || "",
      name: req.body.name.trim(),
      specialization: req.body.specialization.trim(),
      experience: Number(req.body.experience),
      location: req.body.location.trim(),
      fees: Number(req.body.fees),
      profileImage: req.body.profileImage?.trim() || "",
    });

    if (req.body.userId) {
      doctor.userId = req.body.userId;
    }

    await doctor.save();
    console.info("admin_action", {
      action: "create_doctor",
      actorId: req.user.id,
      doctorId: String(doctor._id),
    });
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const validationError = validateDoctorPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updatePayload = {
      email: req.body.email?.trim().toLowerCase() || "",
      name: req.body.name.trim(),
      specialization: req.body.specialization.trim(),
      experience: Number(req.body.experience),
      location: req.body.location.trim(),
      fees: Number(req.body.fees),
      profileImage: req.body.profileImage?.trim() || "",
    };

    if (req.body.userId) {
      updatePayload.userId = req.body.userId;
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    console.info("admin_action", {
      action: "update_doctor",
      actorId: req.user.id,
      doctorId: String(doctor._id),
    });

    res.json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update hospital/clinic details for doctor
router.put("/:id/hospital-details", authenticateUser, async (req, res) => {
  try {
    const { hospitalClinicDetails } = req.body;

    if (!hospitalClinicDetails) {
      return res.status(400).json({ error: "Hospital/clinic details are required" });
    }

    // Validate required fields
    if (!hospitalClinicDetails.clinicAddress || !hospitalClinicDetails.phoneNumber) {
      return res.status(400).json({
        error: "Clinic address and phone number are required",
      });
    }

    const existingDoctor = await Doctor.findById(req.params.id);
    if (!existingDoctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (!canManageDoctor(req.user, existingDoctor)) {
      return res.status(403).json({ error: "You can only update your own doctor profile" });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        hospitalClinicDetails: {
          hospitalName: hospitalClinicDetails.hospitalName || "",
          clinicName: hospitalClinicDetails.clinicName || "",
          clinicImage: hospitalClinicDetails.clinicImage || "",
          clinicAddress: hospitalClinicDetails.clinicAddress.trim(),
          phoneNumber: hospitalClinicDetails.phoneNumber.trim(),
          licenseNumber: hospitalClinicDetails.licenseNumber || "",
          registrationNumber: hospitalClinicDetails.registrationNumber || "",
          timings: hospitalClinicDetails.timings || "",
          services: hospitalClinicDetails.services || [],
        },
        detailsSubmitted: true,
      },
      { new: true, runValidators: true }
    );

    res.json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update availability for doctor
router.put("/:id/availability", authenticateUser, async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({ error: "Availability data is required" });
    }

    const existingDoctor = await Doctor.findById(req.params.id);
    if (!existingDoctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (!canManageDoctor(req.user, existingDoctor)) {
      return res.status(403).json({ error: "You can only update your own doctor profile" });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { availability },
      { new: true, runValidators: true }
    );

    res.json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete doctor and associated user login
router.delete("/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId);
    }

    await Doctor.findByIdAndDelete(req.params.id);
    console.info("admin_action", {
      action: "delete_doctor",
      actorId: req.user.id,
      doctorId: req.params.id,
    });
    res.json({ message: "Doctor and login deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload image to cloudinary
router.post("/upload-image", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.DOCTOR), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "medixo_clinic_images",
    });

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

module.exports = router;
