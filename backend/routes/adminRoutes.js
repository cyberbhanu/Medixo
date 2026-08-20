const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Doctor = require("../models/Doctor");

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/auth");

// =====================================================
// ADMIN ACCESS
// Every route below is Super Admin only
// =====================================================

router.use(
  authenticateUser,
  authorizeRoles("super_admin")
);

// =====================================================
// GET ALL STAFF
// GET /api/admin/staff
// =====================================================

router.get("/staff", async (req, res) => {
  try {
    const staff = await User.find({
      role: "staff",
    })
      .select("-password")
      .populate("clinicId", "name city state")
      .populate("doctorId", "name specialization email clinic clinics");

    res.json(staff);
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      error: "Failed to fetch staff",
    });
  }
});

// =====================================================
// VALIDATE STAFF ASSIGNMENT
// =====================================================

const validateAssignment = async (clinicId, doctorId) => {
  if (!doctorId) {
    return null;
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return "Selected doctor was not found";
  }

  if (!clinicId) {
    return null;
  }

  const belongsToClinic =
    String(doctor.clinic || "") === String(clinicId) ||
    (Array.isArray(doctor.clinics) &&
      doctor.clinics.some(
        (id) => String(id) === String(clinicId)
      ));

  if (!belongsToClinic) {
    return "Selected doctor does not belong to the selected clinic";
  }

  return null;
};

// =====================================================
// CREATE STAFF
// POST /api/admin/staff
// =====================================================

router.post("/staff", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      address,
      clinicId,
      doctorId,
      staffRole,
      joiningDate,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        error: "A user with this email already exists",
      });
    }

    const assignmentError = await validateAssignment(
      clinicId || null,
      doctorId || null
    );

    if (assignmentError) {
      return res.status(400).json({
        error: assignmentError,
      });
    }

    const staff = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: "staff",

      phone: phone || "",
      gender: gender || "",
      address: address || "",

      clinicId: clinicId || null,
      doctorId: doctorId || null,

      staffRole: staffRole || "Receptionist",

      joiningDate: joiningDate || null,

      isActive: true,
    });

    await staff.save();

    const safeStaff = await User.findById(staff._id)
      .select("-password")
      .populate("clinicId", "name city state")
      .populate("doctorId", "name specialization email clinic clinics");

    res.status(201).json(safeStaff);
  } catch (error) {
    console.error("Create staff error:", error);

    res.status(500).json({
      error: error.message || "Failed to create staff",
    });
  }
});

// =====================================================
// UPDATE STAFF
// PUT /api/admin/staff/:id
// =====================================================

router.put("/staff/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      address,
      clinicId,
      doctorId,
      staffRole,
      joiningDate,
    } = req.body;

    const staff = await User.findOne({
      _id: req.params.id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({
        error: "Staff member not found",
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const assignmentError = await validateAssignment(
      clinicId || null,
      doctorId || null
    );

    if (assignmentError) {
      return res.status(400).json({
        error: assignmentError,
      });
    }

    staff.name = name ?? staff.name;

    if (email) {
      staff.email = email.toLowerCase();
    }

    staff.phone = phone ?? staff.phone;
    staff.gender = gender ?? staff.gender;
    staff.address = address ?? staff.address;

    staff.clinicId = clinicId || null;
    staff.doctorId = doctorId || null;

    staff.staffRole = staffRole || staff.staffRole;

    if (password) {
      staff.password = password;
    }

    if (joiningDate) {
      staff.joiningDate = joiningDate;
    }

    await staff.save();

    const updatedStaff = await User.findById(staff._id)
      .select("-password")
      .populate("clinicId", "name city state")
      .populate("doctorId", "name specialization email clinic clinics");

    res.json(updatedStaff);
  } catch (error) {
    console.error("Update staff error:", error);

    res.status(500).json({
      error: error.message || "Failed to update staff",
    });
  }
});

// =====================================================
// UPDATE CUSTOMER PASSWORD
// PUT /api/admin/customer-password
// =====================================================

router.put("/customer-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Customer email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const customer = await User.findOne({
      email,
      role: { $in: ["patient", "customer"] },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer login account not found" });
    }

    customer.password = password;
    await customer.save();

    res.json({ message: "Customer password updated successfully" });
  } catch (error) {
    console.error("Update customer password error:", error);
    res.status(500).json({ error: error.message || "Failed to update customer password" });
  }
});

// =====================================================
// ENABLE / DISABLE STAFF
// PATCH /api/admin/staff/:id/status
// =====================================================

router.patch("/staff/:id/status", async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({
        error: "Staff member not found",
      });
    }

    staff.isActive = Boolean(req.body.isActive);

    await staff.save();

    res.json({
      message: staff.isActive
        ? "Staff account enabled"
        : "Staff account disabled",
      staff,
    });
  } catch (error) {
    console.error("Staff status error:", error);

    res.status(500).json({
      error: "Failed to update staff status",
    });
  }
});

// =====================================================
// DELETE STAFF
// DELETE /api/admin/staff/:id
// =====================================================

router.delete("/staff/:id", async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({
        error: "Staff member not found",
      });
    }

    await User.findByIdAndDelete(staff._id);

    res.json({
      message: "Staff account deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);

    res.status(500).json({
      error: "Failed to delete staff",
    });
  }
});

module.exports = router;
