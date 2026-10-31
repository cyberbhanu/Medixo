const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Clinic = require("../models/Clinic");
const Appointment = require("../models/Appointment");
const { ROLES } = require("../utils/roles");
const { isGlobalAdmin, getScopedDoctors, getScopedHospitals, getScopedLabs } = require("../utils/adminScope");

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/auth");

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const isMonth = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));

const getCoAdminActivity = async (coAdmin, date, month) => {
  const managedCities = Array.isArray(coAdmin.managedCities)
    ? coAdmin.managedCities.map((city) => String(city || "").trim()).filter(Boolean)
    : [];
  const scopedUser = { ...coAdmin, managedCities };
  const [doctors, hospitals, labs] = await Promise.all([
    getScopedDoctors(scopedUser),
    getScopedHospitals(scopedUser),
    getScopedLabs(scopedUser),
  ]);
  const doctorIds = doctors.map((item) => item._id);
  const hospitalIds = hospitals.map((item) => item._id);
  const labIds = labs.map((item) => item._id);
  const staffFilter = {
    role: "staff",
    $or: [
      ...(doctorIds.length ? [{ doctorId: { $in: doctorIds } }] : []),
      ...(hospitalIds.length ? [{ hospitalId: { $in: hospitalIds } }] : []),
    ],
  };
  const [staff, staffRecords] = await Promise.all([
    User.countDocuments(staffFilter),
    User.find(staffFilter).select("name email phone doctorId hospitalId isActive").populate("doctorId", "name").populate("hospitalId", "name").lean(),
  ]);

  const appointmentScope = {
    $or: [
      ...(doctorIds.length ? [{ doctorId: { $in: doctorIds } }] : []),
      ...(hospitalIds.length ? [{ hospital: { $in: hospitalIds } }] : []),
      ...(labIds.length ? [{ labId: { $in: labIds } }] : []),
    ],
  };
  const hasScope = appointmentScope.$or.length > 0;
  const dailyFilter = { ...appointmentScope, ...(hasScope ? { appointmentDate: date } : { _id: null }) };
  const monthFilter = { ...appointmentScope, ...(hasScope ? { appointmentDate: { $gte: `${month}-01`, $lt: `${month}-32` } } : { _id: null }) };
  const [dailyAppointments, monthlyAppointments] = await Promise.all([
    Appointment.find(dailyFilter)
      .populate("doctorId", "name")
      .populate("labId", "name")
      .sort({ appointmentTime: 1, createdAt: -1 })
      .lean(),
    Appointment.find(monthFilter)
      .select("patientId patientName patientEmail patientPhone status reportUrl appointmentDate appointmentTime doctorId labId hospital reason")
      .populate("doctorId", "name")
      .populate("labId", "name")
      .populate("hospital", "name")
      .sort({ appointmentDate: -1, appointmentTime: 1 })
      .lean(),
  ]);
  const patientKeys = new Set(monthlyAppointments.map((item) => String(item.patientId || item.patientEmail || "").toLowerCase()).filter(Boolean));

  return {
    id: String(coAdmin._id),
    name: coAdmin.name,
    email: coAdmin.email,
    state: coAdmin.state || "",
    district: coAdmin.district || "",
    managedCities,
    counts: {
      doctors: doctors.length,
      hospitals: hospitals.length,
      laboratories: labs.length,
      staff,
      dailyAppointments: dailyAppointments.length,
      monthlyAppointments: monthlyAppointments.length,
      monthlyCompleted: monthlyAppointments.filter((item) => item.status === "Completed").length,
      monthlyReports: monthlyAppointments.filter((item) => Boolean(item.reportUrl)).length,
      monthlyPatients: patientKeys.size,
    },
    dailyAppointments: dailyAppointments.slice(0, 25),
    monthlyAppointments: monthlyAppointments.slice(0, 100),
    records: {
      doctors: doctors.map((item) => ({ _id: item._id, name: item.name, email: item.email, specialization: item.specialization, location: item.location })),
      hospitals: hospitals.map((item) => ({ _id: item._id, name: item.name, city: item.city, state: item.state, phone: item.phone })),
      laboratories: labs.map((item) => ({ _id: item._id, name: item.name, location: item.location, phone: item.phone })),
      staff: staffRecords.map((item) => ({ _id: item._id, name: item.name, email: item.email, phone: item.phone, doctor: item.doctorId?.name || "", hospital: item.hospitalId?.name || "", isActive: item.isActive !== false })),
    },
  };
};

router.get("/co-admins/activity", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const date = isDate(req.query.date) ? String(req.query.date) : new Date().toISOString().slice(0, 10);
    const month = isMonth(req.query.month) ? String(req.query.month) : date.slice(0, 7);
    const coAdmins = await User.find({ role: ROLES.DISTRICT_ADMIN, isActive: { $ne: false } }).select("-password").lean();
    const activity = await Promise.all(coAdmins.map((coAdmin) => getCoAdminActivity(coAdmin, date, month)));
    res.json({ date, month, coAdmins: activity });
  } catch (error) {
    res.status(500).json({ error: error.message || "Unable to load co-admin activity" });
  }
});

// =====================================================
// ADMIN ACCESS
// Super admins are global; district admins are restricted to their managed cities.
// =====================================================

router.use(
  authenticateUser,
  authorizeRoles("super_admin", "district_admin")
);

// =====================================================
// GET ALL STAFF
// GET /api/admin/staff
// =====================================================

router.get("/staff", async (req, res) => {
  try {
    const doctorIds = (await getScopedDoctors(req.user)).map((doctor) => doctor._id);
    const hospitalIds = (await getScopedHospitals(req.user)).map((hospital) => hospital._id);
    const staffFilter = isGlobalAdmin(req.user)
      ? { role: "staff" }
      : { role: "staff", $or: [{ doctorId: { $in: doctorIds } }, { hospitalId: { $in: hospitalIds } }] };
    const staff = await User.find(staffFilter)
      .select("-password")
      .populate("clinicId", "name city state")
      .populate("hospitalId", "name city state")
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

const validateAssignment = async (hospitalId, clinicId, doctorId) => {
  const normalizedHospitalId = hospitalId ? String(hospitalId).trim() : null;
  const normalizedClinicId = clinicId ? String(clinicId).trim() : null;
  const normalizedDoctorId = doctorId ? String(doctorId).trim() : null;

  if (normalizedHospitalId) {
    const hospital = await Hospital.findOne({
      _id: normalizedHospitalId,
      isActive: { $ne: false },
    });

    if (!hospital) {
      return "Selected hospital was not found";
    }
  }

  if (normalizedClinicId) {
    const clinic = await Clinic.findById(normalizedClinicId);

    if (!clinic) {
      return "Selected clinic was not found";
    }

    if (clinic.isActive === false) {
      return "Selected clinic is inactive";
    }
  }

  if (!normalizedDoctorId) {
    return null;
  }

  const doctor = await Doctor.findById(normalizedDoctorId);

  if (!doctor) {
    return "Selected doctor was not found";
  }

  if (!normalizedClinicId) {
    return null;
  }

  const belongsToClinic =
    String(doctor.clinic || "") === normalizedClinicId ||
    (Array.isArray(doctor.clinics) &&
      doctor.clinics.some((id) => String(id) === normalizedClinicId));

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
      hospitalId,
      clinicId,
      doctorId,
      staffRole,
      joiningDate,
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "A user with this email already exists",
      });
    }

    if (!isGlobalAdmin(req.user)) {
      const [scopedDoctors, scopedHospitals] = await Promise.all([
        getScopedDoctors(req.user),
        getScopedHospitals(req.user),
      ]);
      if (hospitalId && !scopedHospitals.some((item) => String(item._id) === String(hospitalId))) {
        return res.status(403).json({ error: "This hospital is outside your assigned district" });
      }
      if (doctorId && !scopedDoctors.some((item) => String(item._id) === String(doctorId))) {
        return res.status(403).json({ error: "This doctor is outside your assigned district" });
      }
      if (!hospitalId && !doctorId) {
        return res.status(403).json({ error: "Assign staff to a doctor or hospital in your district" });
      }
    }

    const assignmentError = await validateAssignment(
      hospitalId || null,
      clinicId || null,
      doctorId || null
    );

    if (assignmentError) {
      return res.status(400).json({
        error: assignmentError,
      });
    }

    const staff = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: "staff",

      phone: phone || "",
      gender: gender || "",
      address: address || "",

      hospitalId: hospitalId || null,
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
      .populate("hospitalId", "name city state")
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
      hospitalId,
      clinicId,
      doctorId,
      staffRole,
      joiningDate,
    } = req.body;

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    const staff = await User.findOne({
      _id: req.params.id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({
        error: "Staff member not found",
      });
    }

    if (!isGlobalAdmin(req.user)) {
      const [scopedDoctors, scopedHospitals] = await Promise.all([
        getScopedDoctors(req.user),
        getScopedHospitals(req.user),
      ]);
      const canAccess = [staff.doctorId, staff.hospitalId].some((id) =>
        [...scopedDoctors, ...scopedHospitals].some((item) => String(item._id) === String(id))
      );
      if (!canAccess) return res.status(403).json({ error: "Staff member is outside your assigned district" });
      if (hospitalId && !scopedHospitals.some((item) => String(item._id) === String(hospitalId))) {
        return res.status(403).json({ error: "This hospital is outside your assigned district" });
      }
      if (doctorId && !scopedDoctors.some((item) => String(item._id) === String(doctorId))) {
        return res.status(403).json({ error: "This doctor is outside your assigned district" });
      }
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    if (normalizedEmail) {
      const duplicateUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: staff._id },
      });

      if (duplicateUser) {
        return res.status(409).json({
          error: "A user with this email already exists",
        });
      }
    }

    const assignmentError = await validateAssignment(
      hospitalId || null,
      clinicId || null,
      doctorId || null
    );

    if (assignmentError) {
      return res.status(400).json({
        error: assignmentError,
      });
    }

    staff.name = name ? String(name).trim() : staff.name;

    if (normalizedEmail) {
      staff.email = normalizedEmail;
    }

    staff.phone = phone ?? staff.phone;
    staff.gender = gender ?? staff.gender;
    staff.address = address ?? staff.address;

    staff.hospitalId = hospitalId || null;
    staff.clinicId = clinicId || null;
    staff.doctorId = doctorId || null;

    staff.staffRole = staffRole ? String(staffRole).trim() || staff.staffRole : staff.staffRole;

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
      .populate("hospitalId", "name city state")
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

    if (!isGlobalAdmin(req.user)) {
      const [scopedDoctors, scopedHospitals] = await Promise.all([
        getScopedDoctors(req.user),
        getScopedHospitals(req.user),
      ]);
      const canAccess = [staff.doctorId, staff.hospitalId].some((id) =>
        [...scopedDoctors, ...scopedHospitals].some((item) => String(item._id) === String(id))
      );
      if (!canAccess) return res.status(403).json({ error: "Staff member is outside your assigned district" });
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

    if (!isGlobalAdmin(req.user)) {
      const [scopedDoctors, scopedHospitals] = await Promise.all([
        getScopedDoctors(req.user),
        getScopedHospitals(req.user),
      ]);
      const canAccess = [staff.doctorId, staff.hospitalId].some((id) =>
        [...scopedDoctors, ...scopedHospitals].some((item) => String(item._id) === String(id))
      );
      if (!canAccess) return res.status(403).json({ error: "Staff member is outside your assigned district" });
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
