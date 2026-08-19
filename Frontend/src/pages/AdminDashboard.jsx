import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAppointments,
  getPatientReport,
  getDoctors,
  getClinics,
  createClinic,
  updateClinic,
  deleteClinic,
  updateDoctor,
  adminCreateUser,
  deleteDoctor,
  uploadDoctorImage,
  getAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  toggleAdminStaffStatus,
  deleteAdminStaff,
  updateAppointment,
} from "../api";
import DashboardLayout, {
  DashboardIcon,
  DashboardSection,
} from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";
import PrescriptionPrintButton from "../components/PrescriptionPrintButton";

const EMPTY_DOCTOR = {
  name: "",
  email: "",
  password: "",
  specialization: "",
  experience: "",
  location: "",
  fees: "",
  profileImage: "",
  clinicId: "",
};

const EMPTY_CLINIC = {
  name: "",
  city: "",
  state: "Bihar",
  address: "",
  phone: "",
  email: "",
  consultationFee: "",
  appointmentDuration: "15",
  bookingMode: "both",
  specialties: "",
  openingHours: "",
  about: "",
  isVerified: false,
};

const EMPTY_STAFF = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "Other",
  staffRole: "Receptionist",
  clinicId: "",
  doctorId: "",
  joiningDate: "",
  address: "",
};

const STATUS_OPTIONS = [
  "Scheduled",
  "Approved",
  "Rejected",
  "Completed",
  "Cancelled",
  "Rescheduled",
];

const STAFF_ROLES = [
  "Receptionist",
  "Clinic Manager",
  "Nurse",
  "Lab Technician",
  "Pharmacist",
  "Support Staff",
];

const getId = (value) => value?._id || value?.id || value || "";

const getAppointmentClinicId = (appointment) =>
  getId(appointment?.clinic) ||
  getId(appointment?.clinicId) ||
  getId(appointment?.clinic?._id);

const patientKey = (appointment) =>
  appointment?.patientId ||
  appointment?.patientEmail ||
  appointment?.patientPhone ||
  appointment?.patientName ||
  appointment?._id;

const downloadCsv = (rows, filename) => {
  if (!rows.length) return;

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export default function AdminDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Admin";

  const doctorFormRef = useRef(null);
  const clinicFormRef = useRef(null);
  const staffFormRef = useRef(null);
  const patientSectionRef = useRef(null);
  const appointmentSectionRef = useRef(null);

  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);

  const [doctorForm, setDoctorForm] = useState(EMPTY_DOCTOR);
  const [clinicForm, setClinicForm] = useState(EMPTY_CLINIC);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF);

  const [editingDoctorId, setEditingDoctorId] = useState("");
  const [editingClinicId, setEditingClinicId] = useState("");
  const [editingStaffId, setEditingStaffId] = useState("");

  const [selectedPatientKey, setSelectedPatientKey] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [appointmentFilters, setAppointmentFilters] = useState({
    doctorId: "",
    clinicId: "",
    status: "",
    date: "",
    search: "",
  });

  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportDoctorId, setReportDoctorId] = useState("");
  const [reportClinicId, setReportClinicId] = useState("");
  const [patientReport, setPatientReport] = useState({ summary: {}, patients: [] });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [clinicSearch, setClinicSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [uploadingDoctorImage, setUploadingDoctorImage] = useState(false);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const staffDoctors = useMemo(() => {
    return Array.isArray(doctors) ? doctors : [];
  }, [doctors]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [doctorResult, clinicResult, appointmentResult, staffResult] =
        await Promise.allSettled([
          getDoctors(),
          getClinics(),
          getAppointments(),
          getAdminStaff(),
        ]);

      const failures = [];

      if (doctorResult.status === "fulfilled") {
        setDoctors(Array.isArray(doctorResult.value) ? doctorResult.value : []);
      } else {
        failures.push(errorMessage(doctorResult.reason, "Unable to load doctors"));
      }

      if (clinicResult.status === "fulfilled") {
        setClinics(Array.isArray(clinicResult.value) ? clinicResult.value : []);
      } else {
        failures.push(errorMessage(clinicResult.reason, "Unable to load clinics"));
      }

      if (appointmentResult.status === "fulfilled") {
        setAppointments(
          Array.isArray(appointmentResult.value) ? appointmentResult.value : []
        );
      } else {
        failures.push(
          errorMessage(appointmentResult.reason, "Unable to load appointments")
        );
      }

      if (staffResult.status === "fulfilled") {
        const value = staffResult.value;
        setStaff(Array.isArray(value) ? value : value?.staff || []);
      } else {
        // Keep the rest of the dashboard usable if the new staff route is not deployed yet.
        setStaff([]);
        failures.push(
          "Staff API is unavailable. Add the admin staff routes before using staff management."
        );
      }

      if (failures.length) {
        setError(failures[0]);
      }
    } catch (requestError) {
      setError(errorMessage(requestError, "Failed to load admin data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadPatientReport = async () => {
      setReportLoading(true);
      setReportError("");

      try {
        const report = await getPatientReport({
          month: reportMonth,
          doctorId: reportDoctorId || undefined,
          clinicId: reportClinicId || undefined,
        });

        if (!ignore) {
          setPatientReport(report || { summary: {}, patients: [] });
        }
      } catch (requestError) {
        if (!ignore) {
          setReportError(errorMessage(requestError, "Unable to load monthly patient report"));
        }
      } finally {
        if (!ignore) setReportLoading(false);
      }
    };

    loadPatientReport();
    return () => {
      ignore = true;
    };
  }, [reportClinicId, reportDoctorId, reportMonth]);

  const patients = useMemo(() => {
    const map = new Map();

    appointments.forEach((appointment) => {
      const key = patientKey(appointment);
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          key,
          patientId: appointment.patientId || "",
          name: appointment.patientName || "Unknown Patient",
          email: appointment.patientEmail || "",
          phone: appointment.patientPhone || "",
          age: appointment.patientAge || "",
          gender: appointment.patientGender || "",
          bookings: 0,
          appointments: [],
          lastAppointment: appointment,
        });
      }

      const patient = map.get(key);
      patient.bookings += 1;
      patient.appointments.push(appointment);

      const currentDate = patient.lastAppointment?.appointmentDate || "";
      if ((appointment.appointmentDate || "") >= currentDate) {
        patient.lastAppointment = appointment;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.bookings - a.bookings);
  }, [appointments]);

  const patientSearchResults = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) =>
      [patient.name, patient.email, patient.phone]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [patients, patientSearch]);

  const doctorSearchResults = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    if (!query) return doctors;

    return doctors.filter((doctor) =>
      [doctor.name, doctor.email, doctor.specialization, doctor.location]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [doctors, doctorSearch]);

  const clinicSearchResults = useMemo(() => {
    const query = clinicSearch.trim().toLowerCase();
    if (!query) return clinics;

    return clinics.filter((clinic) =>
      [clinic.name, clinic.city, clinic.state, clinic.address, clinic.phone]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [clinics, clinicSearch]);

  const staffSearchResults = useMemo(() => {
    const query = staffSearch.trim().toLowerCase();
    if (!query) return staff;

    return staff.filter((member) =>
      [member.name, member.email, member.phone, member.staffRole]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [staff, staffSearch]);

  const filteredAppointments = useMemo(() => {
    const { doctorId, clinicId, status, date, search } = appointmentFilters;
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      if (doctorId && getId(appointment.doctorId) !== doctorId) return false;
      if (clinicId && getAppointmentClinicId(appointment) !== clinicId) return false;
      if (status && appointment.status !== status) return false;
      if (date && appointment.appointmentDate !== date) return false;

      if (query) {
        const haystack = [
          appointment.patientName,
          appointment.patientEmail,
          appointment.patientPhone,
          appointment.doctorId?.name,
          appointment.doctorId?.specialization,
          appointment.reason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [appointments, appointmentFilters]);

  const doctorStats = useMemo(() => {
    const stats = new Map();

    doctors.forEach((doctor) => {
      stats.set(String(doctor._id), {
        appointments: 0,
        patients: new Set(),
        scheduled: 0,
        approved: 0,
        completed: 0,
        cancelled: 0,
      });
    });

    appointments.forEach((appointment) => {
      const doctorId = getId(appointment.doctorId);
      if (!doctorId) return;

      if (!stats.has(String(doctorId))) {
        stats.set(String(doctorId), {
          appointments: 0,
          patients: new Set(),
          scheduled: 0,
          approved: 0,
          completed: 0,
          cancelled: 0,
        });
      }

      const item = stats.get(String(doctorId));
      item.appointments += 1;
      item.patients.add(patientKey(appointment));

      if (appointment.status === "Scheduled") item.scheduled += 1;
      if (appointment.status === "Approved") item.approved += 1;
      if (appointment.status === "Completed") item.completed += 1;
      if (appointment.status === "Cancelled") item.cancelled += 1;
    });

    return stats;
  }, [appointments, doctors]);

  const clinicStats = useMemo(() => {
    const stats = new Map();

    clinics.forEach((clinic) => {
      stats.set(String(clinic._id), {
        doctors: clinic.doctors?.length || 0,
        appointments: 0,
        patients: new Set(),
      });
    });

    appointments.forEach((appointment) => {
      const clinicId = getAppointmentClinicId(appointment);
      if (!clinicId) return;

      if (!stats.has(String(clinicId))) {
        stats.set(String(clinicId), {
          doctors: 0,
          appointments: 0,
          patients: new Set(),
        });
      }

      const item = stats.get(String(clinicId));
      item.appointments += 1;
      item.patients.add(patientKey(appointment));
    });

    return stats;
  }, [appointments, clinics]);

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (appointment) => appointment.appointmentDate === today
  ).length;
  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "Scheduled"
  ).length;
  const approvedAppointments = appointments.filter(
    (appointment) => appointment.status === "Approved"
  ).length;
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "Completed"
  ).length;
  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === "Cancelled"
  ).length;
  const activeStaff = staff.filter((member) => member.isActive !== false).length;

  const stats = [
    {
      icon: "stetho",
      value: String(doctors.length),
      label: "Doctors",
      note: "Doctors managed by admin",
    },
    {
      icon: "hospital",
      value: String(clinics.length),
      label: "Clinics",
      note: "Participating clinics",
    },
    {
      icon: "users",
      value: String(patients.length),
      label: "Booked Patients",
      note: "Unique patients with bookings",
    },
    {
      icon: "users",
      value: String(activeStaff),
      label: "Active Staff",
      note: `${staff.length} staff accounts total`,
    },
    {
      icon: "calendar",
      value: String(appointments.length),
      label: "Appointments",
      note: "All doctor bookings",
    },
    {
      icon: "clock",
      value: String(todayAppointments),
      label: "Today's Bookings",
      note: formatDate(today),
    },
    {
      icon: "bell",
      value: String(pendingAppointments),
      label: "Scheduled Queue",
      note: `${approvedAppointments} approved`,
    },
    {
      icon: "check",
      value: String(completedAppointments),
      label: "Completed",
      note: `${cancelledAppointments} cancelled`,
    },
  ];

  const resetDoctorForm = () => {
    setDoctorForm(EMPTY_DOCTOR);
    setEditingDoctorId("");
  };

  const resetClinicForm = () => {
    setClinicForm(EMPTY_CLINIC);
    setEditingClinicId("");
  };

  const resetStaffForm = () => {
    setStaffForm(EMPTY_STAFF);
    setEditingStaffId("");
  };

  const handleDoctorSubmit = async (event) => {
    event.preventDefault();
    setSavingDoctor(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...doctorForm,
        experience: Number(doctorForm.experience),
        fees: Number(doctorForm.fees),
        clinicId: doctorForm.clinicId || "",
      };

      if (editingDoctorId) {
        await updateDoctor(editingDoctorId, payload);
        setSuccess("Doctor details updated successfully.");
      } else {
        await adminCreateUser({ ...payload, role: "doctor" });
        setSuccess("Doctor account and profile created successfully.");
      }

      resetDoctorForm();
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save doctor details."));
    } finally {
      setSavingDoctor(false);
    }
  };

  const startDoctorEdit = (doctor) => {
    setEditingDoctorId(doctor._id);
    setDoctorForm({
      name: doctor.name || "",
      email: doctor.email || "",
      password: "",
      specialization: doctor.specialization || "",
      experience: String(doctor.experience ?? ""),
      location: doctor.location || "",
      fees: String(doctor.fees ?? ""),
      profileImage: doctor.profileImage || "",
      clinicId: getId(doctor.clinic),
    });
    setError("");
    setSuccess("");
    scrollTo(doctorFormRef);
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Delete this doctor and their login access?")) return;

    try {
      setError("");
      setSuccess("");
      await deleteDoctor(doctorId);
      setSuccess("Doctor deleted successfully.");
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Failed to delete doctor."));
    }
  };

  const handleDoctorImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDoctorImage(true);
    setError("");

    try {
      const data = await uploadDoctorImage(file);
      setDoctorForm((current) => ({
        ...current,
        profileImage: data.imageUrl || "",
      }));
      setSuccess("Doctor image uploaded successfully.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to upload doctor image."));
    } finally {
      setUploadingDoctorImage(false);
      event.target.value = "";
    }
  };

  const handleClinicSubmit = async (event) => {
    event.preventDefault();
    setSavingClinic(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...clinicForm,
        consultationFee: Number(clinicForm.consultationFee || 0),
        appointmentDuration: Number(clinicForm.appointmentDuration || 15),
        specialties: clinicForm.specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingClinicId) {
        await updateClinic(editingClinicId, payload);
        setSuccess("Clinic details updated successfully.");
      } else {
        await createClinic(payload);
        setSuccess("Clinic added to the Medixo network.");
      }

      resetClinicForm();
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save clinic."));
    } finally {
      setSavingClinic(false);
    }
  };

  const startClinicEdit = (clinic) => {
    setEditingClinicId(clinic._id);
    setClinicForm({
      name: clinic.name || "",
      city: clinic.city || "",
      state: clinic.state || "Bihar",
      address: clinic.address || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      consultationFee: String(clinic.consultationFee ?? ""),
      appointmentDuration: String(clinic.appointmentDuration || 15),
      bookingMode: clinic.bookingMode || "both",
      specialties: Array.isArray(clinic.specialties)
        ? clinic.specialties.join(", ")
        : "",
      openingHours: clinic.openingHours || "",
      about: clinic.about || "",
      isVerified: Boolean(clinic.isVerified),
    });
    setError("");
    setSuccess("");
    scrollTo(clinicFormRef);
  };

  const handleDeleteClinic = async (clinicId) => {
    if (!window.confirm("Delete this clinic? Existing appointment history will remain.")) return;

    try {
      setError("");
      setSuccess("");
      await deleteClinic(clinicId);
      setSuccess("Clinic deleted successfully.");
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Failed to delete clinic."));
    }
  };

  const handleStaffSubmit = async (event) => {
    event.preventDefault();
    setSavingStaff(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...staffForm,
        clinicId: staffForm.clinicId || null,
        doctorId: staffForm.doctorId || null,
      };

      if (editingStaffId) {
        await updateAdminStaff(editingStaffId, payload);
        setSuccess("Staff account updated successfully.");
      } else {
        await createAdminStaff(payload);
        setSuccess("Staff account created successfully.");
      }

      resetStaffForm();
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save staff account."));
    } finally {
      setSavingStaff(false);
    }
  };

  const startStaffEdit = (member) => {
    setEditingStaffId(getId(member));
    setStaffForm({
      name: member.name || "",
      email: member.email || "",
      password: "",
      phone: member.phone || "",
      gender: member.gender || "Other",
      staffRole: member.staffRole || "Receptionist",
      clinicId: getId(member.clinicId || member.clinic),
      doctorId: getId(member.doctorId || member.doctor),
      joiningDate: member.joiningDate
        ? String(member.joiningDate).slice(0, 10)
        : "",
      address: member.address || "",
    });
    setSelectedStaffId(getId(member));
    setError("");
    setSuccess("");
    scrollTo(staffFormRef);
  };

  const handleStaffStatus = async (member) => {
    try {
      setError("");
      await toggleAdminStaffStatus(getId(member), member.isActive === false);
      setSuccess(
        member.isActive === false
          ? "Staff account activated."
          : "Staff account disabled."
      );
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update staff status."));
    }
  };

  const handleDeleteStaff = async (member) => {
    if (!window.confirm("Delete this staff account and login access?")) return;

    try {
      setError("");
      setSuccess("");
      await deleteAdminStaff(getId(member));
      setSuccess("Staff account deleted successfully.");
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Failed to delete staff account."));
    }
  };

  const handleAppointmentStatus = async (appointment, status) => {
    if (!appointment?._id) return;

    setUpdatingAppointmentId(appointment._id);
    setError("");
    setSuccess("");

    try {
      await updateAppointment(appointment._id, { status });
      setSuccess(`Appointment marked as ${status}.`);
      await loadDashboardData();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update appointment."));
    } finally {
      setUpdatingAppointmentId("");
    }
  };

  const selectedDoctor = doctors.find((doctor) => doctor._id === selectedDoctorId);
  const selectedClinic = clinics.find((clinic) => clinic._id === selectedClinicId);

  const recentAdminItems = [
    ...appointments.slice(0, 3).map(
      (appointment) =>
        `${appointment.patientName || "Patient"} booked with ${appointment.doctorId?.name || "Doctor"}`
    ),
    ...doctors.slice(0, 2).map((doctor) => `Doctor: ${doctor.name}`),
    ...clinics.slice(0, 2).map((clinic) => `Clinic: ${clinic.name}`),
  ].slice(0, 6);

  const exportAppointments = () => {
    downloadCsv(
      [
        [
          "Patient Name",
          "Patient Email",
          "Patient Phone",
          "Doctor",
          "Specialization",
          "Clinic",
          "Date",
          "Time",
          "Status",
          "Reason",
          "Notes",
        ],
        ...filteredAppointments.map((appointment) => [
          appointment.patientName,
          appointment.patientEmail,
          appointment.patientPhone,
          appointment.doctorId?.name,
          appointment.doctorId?.specialization,
          appointment.clinic?.name || appointment.clinic?.clinicName || "",
          appointment.appointmentDate,
          appointment.appointmentTime,
          appointment.status,
          appointment.reason,
          appointment.notes,
        ]),
      ],
      "medixo-appointments.csv"
    );
  };

  const exportPatients = () => {
    downloadCsv(
      [
        [
          "Patient Name",
          "Email",
          "Phone",
          "Age",
          "Gender",
          "Total Bookings",
          "Last Appointment",
          "Last Doctor",
        ],
        ...patients.map((patient) => [
          patient.name,
          patient.email,
          patient.phone,
          patient.age,
          patient.gender,
          patient.bookings,
          patient.lastAppointment?.appointmentDate,
          patient.lastAppointment?.doctorId?.name,
        ]),
      ],
      "medixo-patients.csv"
    );
  };

  const exportMonthlyPatientReport = () => {
    const reportPatients = Array.isArray(patientReport.patients)
      ? patientReport.patients
      : [];

    downloadCsv(
      [
        [
          "Patient Name",
          "Email",
          "Phone",
          "Age",
          "Gender",
          "Total Visits",
          "Completed Visits",
          "Last Visit",
          "Last Status",
          "Last Reason",
          "Doctors",
          "Clinics",
        ],
        ...reportPatients.map((patient) => [
          patient.name,
          patient.email,
          patient.phone,
          patient.age,
          patient.gender,
          patient.visits,
          patient.completedVisits,
          patient.lastVisit,
          patient.lastStatus,
          patient.lastReason,
          patient.doctors?.join("; "),
          patient.clinics?.join("; "),
        ]),
      ],
      `medixo-patient-report-${reportMonth}.csv`
    );
  };

  return (
    <DashboardLayout
      role="Admin Dashboard"
      title={`Control center for ${firstName}`}
      subtitle="Manage doctors, clinics, patients, staff, and every appointment from one central Medixo control center."
      chips={[
        "Doctor management",
        "Clinic management",
        "Patient tracking",
        "Staff accounts",
        "Appointment control",
      ]}
      stats={stats}
      quickActions={[
        {
          icon: "plus",
          label: "Add Doctor",
          variant: "primary",
          onClick: () => {
            resetDoctorForm();
            scrollTo(doctorFormRef);
          },
        },
        {
          icon: "plus",
          label: "Add Staff",
          onClick: () => {
            resetStaffForm();
            scrollTo(staffFormRef);
          },
        },
        {
          icon: "file",
          label: "Export Patients",
          onClick: exportPatients,
        },
        {
          icon: "refresh",
          label: "Refresh Data",
          onClick: loadDashboardData,
        },
      ]}
      aside={
        <>
          <DashboardSection title="Admin Workflow">
            <div className="dashboard-mini-list">
              <div className="dashboard-mini-row">
                <span className="dashboard-mini-dot" />
                <p>Admin controls all doctor, clinic, staff, patient and appointment records.</p>
              </div>
              <div className="dashboard-mini-row">
                <span className="dashboard-mini-dot" />
                <p>Patient counts are calculated from unique booked-patient identities.</p>
              </div>
              <div className="dashboard-mini-row">
                <span className="dashboard-mini-dot" />
                <p>Doctor and clinic cards show their booking and patient workload.</p>
              </div>
              <div className="dashboard-mini-row">
                <span className="dashboard-mini-dot" />
                <p>Use the appointment filters before approving, completing, cancelling or exporting bookings.</p>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection title="Appointment Health">
            <div className="dashboard-metric-list">
              <div className="dashboard-metric-row">
                <span>Scheduled</span>
                <strong>{pendingAppointments}</strong>
              </div>
              <div className="dashboard-metric-row">
                <span>Approved</span>
                <strong>{approvedAppointments}</strong>
              </div>
              <div className="dashboard-metric-row">
                <span>Completed</span>
                <strong>{completedAppointments}</strong>
              </div>
              <div className="dashboard-metric-row">
                <span>Cancelled</span>
                <strong>{cancelledAppointments}</strong>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection title="Recent Activity">
            <div className="dashboard-mini-list">
              {recentAdminItems.length ? (
                recentAdminItems.map((item, index) => (
                  <div key={`${item}-${index}`} className="dashboard-mini-row">
                    <span className="dashboard-mini-dot urgent" />
                    <p>{item}</p>
                  </div>
                ))
              ) : (
                <p className="dashboard-empty-state">No recent activity yet.</p>
              )}
            </div>
          </DashboardSection>
        </>
      }
    >
      {error ? <div className="dashboard-banner error">{error}</div> : null}
      {success ? <div className="dashboard-banner success">{success}</div> : null}

      <DashboardSection
        title="Doctor Management"
        action={editingDoctorId ? "Editing Doctor" : "Add Doctor"}
        onActionClick={() => {
          resetDoctorForm();
          scrollTo(doctorFormRef);
        }}
      >
        <div className="dashboard-admin-grid">
          <form ref={doctorFormRef} className="dashboard-form-card" onSubmit={handleDoctorSubmit}>
            <div className="dashboard-form-heading">
              <span>Doctor profile</span>
              <h3>{editingDoctorId ? "Update doctor details" : "Create a doctor account"}</h3>
              <p>Set the doctor&apos;s login, practice details, clinic, and profile image.</p>
            </div>
            <div className="dashboard-form-grid">
              <label className="dashboard-input-group">
                <span>Doctor name *</span>
                <input
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="Dr. Arjun Sharma"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Email login *</span>
                <input
                  type="email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  placeholder="doctor@medixo.com"
                  required
                  disabled={Boolean(editingDoctorId)}
                />
              </label>

              {!editingDoctorId ? (
                <label className="dashboard-input-group">
                  <span>Password *</span>
                  <input
                    type="password"
                    minLength="6"
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </label>
              ) : null}

              <label className="dashboard-input-group">
                <span>Specialization *</span>
                <input
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  placeholder="Cardiology"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Experience (years) *</span>
                <input
                  type="number"
                  min="0"
                  value={doctorForm.experience}
                  onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                  placeholder="10"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Consultation fee *</span>
                <input
                  type="number"
                  min="0"
                  value={doctorForm.fees}
                  onChange={(e) => setDoctorForm({ ...doctorForm, fees: e.target.value })}
                  placeholder="800"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>City / location *</span>
                <input
                  value={doctorForm.location}
                  onChange={(e) => setDoctorForm({ ...doctorForm, location: e.target.value })}
                  placeholder="Muzaffarpur"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Primary clinic</span>
                <select
                  value={doctorForm.clinicId}
                  onChange={(e) => setDoctorForm({ ...doctorForm, clinicId: e.target.value })}
                >
                  <option value="">Independent practice</option>
                  {clinics.map((clinic) => (
                    <option key={clinic._id} value={clinic._id}>
                      {clinic.name} — {clinic.city}
                    </option>
                  ))}
                </select>
              </label>

              <div className="dashboard-input-group full-width">
                <span>Doctor profile image</span>
                <div className="dashboard-upload-row">
                  <label className="dashboard-upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDoctorImageUpload}
                      disabled={uploadingDoctorImage}
                    />
                    {doctorForm.profileImage ? (
                      <img src={doctorForm.profileImage} alt="Doctor preview" />
                    ) : (
                      <span>{uploadingDoctorImage ? "Uploading..." : "Upload doctor image"}</span>
                    )}
                  </label>
                  <label className="dashboard-input-group dashboard-url-input">
                    <span>Or paste image URL</span>
                    <input
                      type="url"
                      value={doctorForm.profileImage}
                      onChange={(e) => setDoctorForm({ ...doctorForm, profileImage: e.target.value })}
                      placeholder="https://example.com/doctor.jpg"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-action" type="submit" disabled={savingDoctor}>
                {savingDoctor ? "Saving..." : editingDoctorId ? "Update Doctor" : "Add Doctor"}
              </button>
              <button className="dashboard-secondary-action" type="button" onClick={resetDoctorForm}>
                Clear Form
              </button>
            </div>
          </form>

          <div className="dashboard-admin-list">
            <label className="dashboard-input-group">
              <span>Search doctors</span>
              <input
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Name, specialization or city"
              />
            </label>

            {loading ? (
              <p className="dashboard-empty-state">Loading doctors...</p>
            ) : doctorSearchResults.length ? (
              doctorSearchResults.map((doctor) => {
                const stat = doctorStats.get(String(doctor._id)) || {
                  appointments: 0,
                  patients: new Set(),
                  scheduled: 0,
                  completed: 0,
                };

                return (
                  <article key={doctor._id} className="dashboard-admin-record">
                    <div className="dashboard-record-header">
                      <div className="dashboard-record-identity">
                        {doctor.profileImage ? (
                          <img
                            src={doctor.profileImage}
                            alt={doctor.name}
                            className="dashboard-record-avatar"
                          />
                        ) : (
                          <span className="dashboard-record-avatar fallback">
                            {doctor.name?.charAt(0) || "D"}
                          </span>
                        )}
                        <div>
                          <h3>{doctor.name}</h3>
                          <p>{doctor.specialization || "Doctor"}</p>
                        </div>
                      </div>
                      <span className="dashboard-inline-badge">{doctor.location}</span>
                    </div>

                    <div className="dashboard-record-meta">
                      <span><DashboardIcon name="stetho" /> {doctor.specialization}</span>
                      <span><DashboardIcon name="clock" /> {doctor.experience} yrs</span>
                      <span><DashboardIcon name="rupee" /> Rs. {doctor.fees}</span>
                      <span><DashboardIcon name="hospital" /> {doctor.clinic?.name || "Independent"}</span>
                    </div>

                    <div className="dashboard-record-grid">
                      <span><strong>Patients:</strong> {stat.patients.size}</span>
                      <span><strong>Bookings:</strong> {stat.appointments}</span>
                      <span><strong>Scheduled:</strong> {stat.scheduled}</span>
                      <span><strong>Completed:</strong> {stat.completed}</span>
                    </div>

                    <div className="dashboard-action-row">
                      <button
                        type="button"
                        className="dashboard-secondary-action"
                        onClick={() => {
                          setSelectedDoctorId(doctor._id);
                          setAppointmentFilters((current) => ({ ...current, doctorId: doctor._id }));
                          scrollTo(appointmentSectionRef);
                        }}
                      >
                        View Appointments ({stat.appointments})
                      </button>
                      <button
                        type="button"
                        className="dashboard-secondary-action"
                        onClick={() => {
                          setSelectedDoctorId(doctor._id);
                          setPatientSearch("");
                          scrollTo(patientSectionRef);
                        }}
                      >
                        View Patients ({stat.patients.size})
                      </button>
                      <button
                        type="button"
                        className="dashboard-secondary-action"
                        onClick={() => startDoctorEdit(doctor)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="dashboard-secondary-action danger"
                        onClick={() => handleDeleteDoctor(doctor._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="dashboard-empty-state">No doctors found.</p>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Clinic Management"
        action={editingClinicId ? "Editing Clinic" : "Add Clinic"}
        onActionClick={() => {
          resetClinicForm();
          scrollTo(clinicFormRef);
        }}
      >
        <div className="dashboard-admin-grid">
          <form ref={clinicFormRef} className="dashboard-form-card" onSubmit={handleClinicSubmit}>
            <div className="dashboard-form-heading">
              <span>Clinic profile</span>
              <h3>{editingClinicId ? "Update clinic details" : "Create a clinic profile"}</h3>
              <p>Keep location, booking rules, contact details, and verification in one place.</p>
            </div>
            <div className="dashboard-form-grid">
              {[
                ["name", "Clinic name *", "Medixo Care Clinic"],
                ["city", "City / market *", "Muzaffarpur"],
                ["state", "State", "Bihar"],
                ["address", "Full address *", "Main Market, Muzaffarpur"],
                ["phone", "Phone", "9876543210"],
                ["email", "Email", "clinic@medixo.com"],
                ["consultationFee", "Default consultation fee", "500"],
                ["openingHours", "Opening hours", "9:00 AM - 8:00 PM"],
                ["specialties", "Specialties", "General Medicine, Pediatrics"],
              ].map(([key, label, placeholder]) => (
                <label className="dashboard-input-group" key={key}>
                  <span>{label}</span>
                  <input
                    type={key === "email" ? "email" : key === "consultationFee" ? "number" : "text"}
                    min={key === "consultationFee" ? "0" : undefined}
                    value={clinicForm[key]}
                    onChange={(e) => setClinicForm({ ...clinicForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={label.includes("*")}
                  />
                </label>
              ))}

              <label className="dashboard-input-group">
                <span>Appointment duration</span>
                <select
                  value={clinicForm.appointmentDuration}
                  onChange={(e) => setClinicForm({ ...clinicForm, appointmentDuration: e.target.value })}
                >
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Booking mode</span>
                <select
                  value={clinicForm.bookingMode}
                  onChange={(e) => setClinicForm({ ...clinicForm, bookingMode: e.target.value })}
                >
                  <option value="both">Online + Pay at Clinic</option>
                  <option value="online">Online payment</option>
                  <option value="pay_at_clinic">Pay at clinic</option>
                </select>
              </label>

              <label className="dashboard-input-group full-width">
                <span>About clinic</span>
                <textarea
                  value={clinicForm.about}
                  onChange={(e) => setClinicForm({ ...clinicForm, about: e.target.value })}
                  placeholder="Short description of the clinic"
                />
              </label>

              <label className="dashboard-input-group">
                <span>Verification</span>
                <select
                  value={clinicForm.isVerified ? "verified" : "pending"}
                  onChange={(e) =>
                    setClinicForm({ ...clinicForm, isVerified: e.target.value === "verified" })
                  }
                >
                  <option value="pending">Pending verification</option>
                  <option value="verified">Verified</option>
                </select>
              </label>
            </div>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-action" type="submit" disabled={savingClinic}>
                {savingClinic ? "Saving..." : editingClinicId ? "Update Clinic" : "Add Clinic"}
              </button>
              <button className="dashboard-secondary-action" type="button" onClick={resetClinicForm}>
                Clear Form
              </button>
            </div>
          </form>

          <div className="dashboard-admin-list">
            <label className="dashboard-input-group">
              <span>Search clinics</span>
              <input
                value={clinicSearch}
                onChange={(e) => setClinicSearch(e.target.value)}
                placeholder="Clinic, city, phone or address"
              />
            </label>

            {clinicSearchResults.length ? (
              clinicSearchResults.map((clinic) => {
                const stat = clinicStats.get(String(clinic._id)) || {
                  doctors: clinic.doctors?.length || 0,
                  appointments: 0,
                  patients: new Set(),
                };

                return (
                  <article key={clinic._id} className="dashboard-admin-record">
                    <div className="dashboard-record-header">
                      <div>
                        <h3>{clinic.name}</h3>
                        <p>{clinic.address || `${clinic.city}, ${clinic.state}`}</p>
                      </div>
                      <span className="dashboard-inline-badge">
                        {clinic.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>

                    <div className="dashboard-record-meta">
                      <span>{clinic.city}, {clinic.state}</span>
                      <span>{clinic.phone || "No phone"}</span>
                      <span>{stat.doctors} doctors</span>
                      <span>Rs. {clinic.consultationFee || 0}</span>
                    </div>

                    <div className="dashboard-record-grid">
                      <span><strong>Patients:</strong> {stat.patients.size}</span>
                      <span><strong>Appointments:</strong> {stat.appointments}</span>
                      <span><strong>Slots:</strong> {clinic.appointmentDuration || 15} min</span>
                      <span><strong>Booking:</strong> {clinic.bookingMode || "both"}</span>
                    </div>

                    <div className="dashboard-action-row">
                      <button
                        type="button"
                        className="dashboard-secondary-action"
                        onClick={() => {
                          setSelectedClinicId(clinic._id);
                          setAppointmentFilters((current) => ({ ...current, clinicId: clinic._id }));
                          scrollTo(appointmentSectionRef);
                        }}
                      >
                        View Appointments ({stat.appointments})
                      </button>
                      <button
                        type="button"
                        className="dashboard-secondary-action"
                        onClick={() => {
                          setSelectedClinicId(clinic._id);
                          scrollTo(patientSectionRef);
                        }}
                      >
                        View Patients ({stat.patients.size})
                      </button>
                      <button
                        type="button"
                        className="dashboard-secondary-action"
                        onClick={() => startClinicEdit(clinic)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="dashboard-secondary-action danger"
                        onClick={() => handleDeleteClinic(clinic._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="dashboard-empty-state">No clinics found.</p>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Patient Management"
        action="Export Patients"
        onActionClick={exportPatients}
        collapsible
        defaultOpen={false}
      >
        <div ref={patientSectionRef} className="dashboard-admin-list">
          <div className="dashboard-filter-row">
            <label className="dashboard-input-group" style={{ flex: "1 1 280px" }}>
              <span>Search patient</span>
              <input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Name, email or phone"
              />
            </label>
            {selectedDoctorId ? (
              <button
                type="button"
                className="dashboard-secondary-action"
                onClick={() => setSelectedDoctorId("")}
              >
                Clear Doctor Selection
              </button>
            ) : null}
            {selectedClinicId ? (
              <button
                type="button"
                className="dashboard-secondary-action"
                onClick={() => setSelectedClinicId("")}
              >
                Clear Clinic Selection
              </button>
            ) : null}
          </div>

          {selectedDoctor ? (
            <div className="dashboard-banner success">
              Showing patients associated with <strong>{selectedDoctor.name}</strong>.
            </div>
          ) : null}
          {selectedClinic ? (
            <div className="dashboard-banner success">
              Showing patients associated with <strong>{selectedClinic.name}</strong>.
            </div>
          ) : null}

          {patientSearchResults.length ? (
            patientSearchResults
              .filter((patient) => {
                if (selectedDoctorId) {
                  return patient.appointments.some(
                    (appointment) => getId(appointment.doctorId) === selectedDoctorId
                  );
                }
                if (selectedClinicId) {
                  return patient.appointments.some(
                    (appointment) => getAppointmentClinicId(appointment) === selectedClinicId
                  );
                }
                return true;
              })
              .map((patient) => (
                <article key={patient.key} className="dashboard-admin-record dashboard-patient-row">
                  <div className="dashboard-patient-row-header">
                    <div className="dashboard-record-identity">
                      <span className="dashboard-record-avatar fallback">
                        {patient.name?.charAt(0) || "P"}
                      </span>
                      <div>
                        <h3>{patient.name}</h3>
                        <p>{patient.email || patient.phone || "No contact details"}</p>
                      </div>
                    </div>
                    <span className="dashboard-inline-badge">
                      {patient.bookings} booking{patient.bookings === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="dashboard-record-meta">
                    <span>Phone: {patient.phone || "—"}</span>
                    <span>Age: {patient.age || "—"}</span>
                    <span>Gender: {patient.gender || "—"}</span>
                    <span>Last visit: {formatDate(patient.lastAppointment?.appointmentDate)}</span>
                  </div>

                  <div className="dashboard-record-grid">
                    <span>
                      <strong>Last doctor:</strong> {patient.lastAppointment?.doctorId?.name || "—"}
                    </span>
                    <span>
                      <strong>Reason:</strong> {patient.lastAppointment?.reason || "—"}
                    </span>
                    <span>
                      <strong>Status:</strong> {patient.lastAppointment?.status || "—"}
                    </span>
                  </div>

                  <div className="dashboard-action-row">
                    <button
                      type="button"
                      className="dashboard-secondary-action"
                      onClick={() =>
                        setSelectedPatientKey(
                          selectedPatientKey === patient.key ? "" : patient.key
                        )
                      }
                    >
                      {selectedPatientKey === patient.key ? "Hide History" : "View Appointment History"}
                    </button>
                    <button
                      type="button"
                      className="dashboard-secondary-action"
                      onClick={() => {
                        setAppointmentFilters({
                          doctorId: "",
                          clinicId: "",
                          status: "",
                          date: "",
                          search: patient.name,
                        });
                        scrollTo(appointmentSectionRef);
                      }}
                    >
                      View All Bookings
                    </button>
                  </div>

                  {selectedPatientKey === patient.key ? (
                    <div className="dashboard-card-list">
                      {patient.appointments.map((appointment) => (
                        <div key={appointment._id} className="dashboard-table-row">
                          <div>
                            <h3>{appointment.doctorId?.name || "Doctor"}</h3>
                            <p>
                              {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime || "—"}
                            </p>
                          </div>
                          <span className="dashboard-inline-badge">{appointment.status}</span>
                          <span>{appointment.reason || "—"}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAppointmentFilters({
                                doctorId: getId(appointment.doctorId),
                                clinicId: getAppointmentClinicId(appointment),
                                status: "",
                                date: appointment.appointmentDate || "",
                                search: "",
                              });
                              scrollTo(appointmentSectionRef);
                            }}
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
          ) : (
            <p className="dashboard-empty-state">No booked patients found.</p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Monthly Patient Report" action="Export Excel" onActionClick={exportMonthlyPatientReport}>
        <div className="dashboard-report-toolbar">
          <label className="dashboard-input-group">
            <span>Report month</span>
            <input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} />
          </label>
          <label className="dashboard-input-group">
            <span>Doctor</span>
            <select value={reportDoctorId} onChange={(event) => setReportDoctorId(event.target.value)}>
              <option value="">All doctors</option>
              {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}
            </select>
          </label>
          <label className="dashboard-input-group">
            <span>Clinic</span>
            <select value={reportClinicId} onChange={(event) => setReportClinicId(event.target.value)}>
              <option value="">All clinics</option>
              {clinics.map((clinic) => <option key={clinic._id} value={clinic._id}>{clinic.name}</option>)}
            </select>
          </label>
          <button type="button" className="dashboard-primary-action" onClick={exportMonthlyPatientReport} disabled={reportLoading}>
            {reportLoading ? "Preparing..." : "Download Excel CSV"}
          </button>
        </div>

        {reportError ? <div className="dashboard-banner error">{reportError}</div> : null}
        <div className="dashboard-report-summary">
          <div><strong>{patientReport.summary?.uniquePatients || 0}</strong><span>Unique patients</span></div>
          <div><strong>{patientReport.summary?.totalVisits || 0}</strong><span>Total visits</span></div>
          <div><strong>{patientReport.summary?.completedVisits || 0}</strong><span>Completed visits</span></div>
          <div><strong>{patientReport.summary?.doctorCount || 0}</strong><span>Doctors covered</span></div>
        </div>

        {reportLoading ? <p className="dashboard-empty-state">Building the monthly patient register...</p> : (
          <div className="dashboard-report-table-wrap">
            <table className="dashboard-report-table">
              <thead>
                <tr><th>Patient</th><th>Contact</th><th>Visits</th><th>Last visit</th><th>Doctor / clinic</th><th>Status</th></tr>
              </thead>
              <tbody>
                {patientReport.patients?.length ? patientReport.patients.map((patient) => (
                  <tr key={patient.patientId || `${patient.email}-${patient.name}`}>
                    <td><strong>{patient.name}</strong><span>{patient.age || "-"} yrs · {patient.gender || "-"}</span></td>
                    <td><span>{patient.email || "No email"}</span><span>{patient.phone || "No phone"}</span></td>
                    <td><strong>{patient.visits}</strong><span>{patient.completedVisits} completed</span></td>
                    <td><span>{patient.lastVisit || "-"}</span><span>{patient.lastReason || "-"}</span></td>
                    <td><span>{patient.doctors?.join(", ") || "-"}</span><span>{patient.clinics?.join(", ") || "No clinic"}</span></td>
                    <td><span className="dashboard-inline-badge">{patient.lastStatus || "-"}</span></td>
                  </tr>
                )) : <tr><td colSpan="6" className="dashboard-report-empty">No patient visits found for this report.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Staff Management"
        action={editingStaffId ? "Editing Staff" : "Add Staff"}
        onActionClick={() => {
          resetStaffForm();
          scrollTo(staffFormRef);
        }}
      >
        <div className="dashboard-admin-grid">
          <form ref={staffFormRef} className="dashboard-form-card" onSubmit={handleStaffSubmit}>
            <div className="dashboard-form-heading">
              <span>Staff access</span>
              <h3>{editingStaffId ? "Update staff details" : "Create a staff account"}</h3>
              <p>Assign the right role, clinic, doctor, and contact details for each team member.</p>
            </div>
            <div className="dashboard-form-grid">
              <label className="dashboard-input-group">
                <span>Full name *</span>
                <input
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Rahul Kumar"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Email login *</span>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="staff@medixo.com"
                  required
                  disabled={Boolean(editingStaffId)}
                />
              </label>

              {!editingStaffId ? (
                <label className="dashboard-input-group">
                  <span>Password *</span>
                  <input
                    type="password"
                    minLength="6"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </label>
              ) : null}

              <label className="dashboard-input-group">
                <span>Phone *</span>
                <input
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="9876543210"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Gender</span>
                <select
                  value={staffForm.gender}
                  onChange={(e) => setStaffForm({ ...staffForm, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Staff role *</span>
                <select
                  value={staffForm.staffRole}
                  onChange={(e) => setStaffForm({ ...staffForm, staffRole: e.target.value })}
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Assign clinic</span>
                <select
                  value={staffForm.clinicId}
                  onChange={(e) => setStaffForm({ ...staffForm, clinicId: e.target.value, doctorId: "" })}
                >
                  <option value="">No clinic assigned</option>
                  {clinics.map((clinic) => (
                    <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                  ))}
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Assign doctor</span>
                <select
                  value={staffForm.doctorId}
                  onChange={(e) => setStaffForm({ ...staffForm, doctorId: e.target.value })}
                >
                  <option value="">No doctor assigned</option>
                  {staffDoctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name}{doctor.specialization ? ` — ${doctor.specialization}` : ""}
                    </option>
                  ))}
                  {!staffDoctors.length ? (
                    <option value="" disabled>
                      {staffForm.clinicId ? "No doctors assigned to this clinic" : "No doctors available"}
                    </option>
                  ) : null}
                </select>
                <small className="dashboard-field-hint">
                  "Optional: choose any doctor directly, with or without a clinic assignment."
                </small>
              </label>

              <label className="dashboard-input-group">
                <span>Joining date</span>
                <input
                  type="date"
                  value={staffForm.joiningDate}
                  onChange={(e) => setStaffForm({ ...staffForm, joiningDate: e.target.value })}
                />
              </label>

              <label className="dashboard-input-group full-width">
                <span>Address</span>
                <textarea
                  value={staffForm.address}
                  onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                  placeholder="Staff address"
                />
              </label>
            </div>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-action" type="submit" disabled={savingStaff}>
                {savingStaff ? "Saving..." : editingStaffId ? "Update Staff" : "Create Staff"}
              </button>
              <button className="dashboard-secondary-action" type="button" onClick={resetStaffForm}>
                Clear Form
              </button>
            </div>
          </form>

          <div className="dashboard-admin-list">
            <label className="dashboard-input-group">
              <span>Search staff</span>
              <input
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Name, email, phone or role"
              />
            </label>

            {staffSearchResults.length ? (
              staffSearchResults.map((member) => (
                <article key={getId(member)} className="dashboard-admin-record">
                  <div className="dashboard-record-header">
                    <div className="dashboard-record-identity">
                      <span className="dashboard-record-avatar fallback">
                        {member.name?.charAt(0) || "S"}
                      </span>
                      <div>
                        <h3>{member.name}</h3>
                        <p>{member.staffRole || "Staff"}</p>
                      </div>
                    </div>
                    <span className="dashboard-inline-badge">
                      {member.isActive === false ? "Disabled" : "Active"}
                    </span>
                  </div>

                  <div className="dashboard-record-meta">
                    <span>Email: {member.email}</span>
                    <span>Phone: {member.phone || "—"}</span>
                    <span>
                      Clinic: {member.clinicId?.name || member.clinic?.name || "Unassigned"}
                    </span>
                    <span>Doctor: {member.doctorId?.name || member.doctor?.name || "Unassigned"}</span>
                    <span>Joined: {formatDate(member.joiningDate)}</span>
                  </div>

                  <div className="dashboard-action-row">
                    <button
                      type="button"
                      className="dashboard-secondary-action"
                      onClick={() => {
                        setSelectedStaffId(getId(member));
                        startStaffEdit(member);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="dashboard-secondary-action"
                      onClick={() => handleStaffStatus(member)}
                    >
                      {member.isActive === false ? "Enable" : "Disable"}
                    </button>
                    <button
                      type="button"
                      className="dashboard-secondary-action danger"
                      onClick={() => handleDeleteStaff(member)}
                    >
                      Delete
                    </button>
                  </div>

                  {selectedStaffId === getId(member) ? (
                    <p className="dashboard-muted-note">
                      {member.address || "No address saved."}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="dashboard-empty-state">
                {loading ? "Loading staff..." : "No staff accounts found."}
              </p>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title="Appointment Management" action="Export CSV" onActionClick={exportAppointments}>
        <div ref={appointmentSectionRef} className="dashboard-admin-list">
          <div className="dashboard-form-card">
            <div className="dashboard-form-grid">
              <label className="dashboard-input-group">
                <span>Search</span>
                <input
                  value={appointmentFilters.search}
                  onChange={(e) =>
                    setAppointmentFilters({ ...appointmentFilters, search: e.target.value })
                  }
                  placeholder="Patient, doctor, phone or reason"
                />
              </label>

              <label className="dashboard-input-group">
                <span>Doctor</span>
                <select
                  value={appointmentFilters.doctorId}
                  onChange={(e) =>
                    setAppointmentFilters({ ...appointmentFilters, doctorId: e.target.value })
                  }
                >
                  <option value="">All doctors</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
                  ))}
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Clinic</span>
                <select
                  value={appointmentFilters.clinicId}
                  onChange={(e) =>
                    setAppointmentFilters({ ...appointmentFilters, clinicId: e.target.value })
                  }
                >
                  <option value="">All clinics</option>
                  {clinics.map((clinic) => (
                    <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                  ))}
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Status</span>
                <select
                  value={appointmentFilters.status}
                  onChange={(e) =>
                    setAppointmentFilters({ ...appointmentFilters, status: e.target.value })
                  }
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Date</span>
                <input
                  type="date"
                  value={appointmentFilters.date}
                  onChange={(e) =>
                    setAppointmentFilters({ ...appointmentFilters, date: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="dashboard-form-actions">
              <button
                type="button"
                className="dashboard-secondary-action"
                onClick={() =>
                  setAppointmentFilters({
                    doctorId: "",
                    clinicId: "",
                    status: "",
                    date: "",
                    search: "",
                  })
                }
              >
                Clear Filters
              </button>
              <button type="button" className="dashboard-primary-action" onClick={exportAppointments}>
                Export {filteredAppointments.length} Appointments
              </button>
            </div>
          </div>

          <div className="dashboard-banner success">
            Showing <strong>{filteredAppointments.length}</strong> of {appointments.length} appointments.
          </div>

          {filteredAppointments.length ? (
            filteredAppointments.map((appointment) => (
              <article key={appointment._id} className="dashboard-admin-record">
                <div className="dashboard-record-header">
                  <div>
                    <h3>{appointment.patientName}</h3>
                    <p>
                      {appointment.doctorId?.name || "Unknown Doctor"}
                      {appointment.doctorId?.specialization
                        ? ` • ${appointment.doctorId.specialization}`
                        : ""}
                    </p>
                  </div>
                  <span className="dashboard-inline-badge">{appointment.status}</span>
                </div>

                <div className="dashboard-record-meta">
                  <span><DashboardIcon name="calendar" /> {formatDate(appointment.appointmentDate)}</span>
                  <span><DashboardIcon name="clock" /> {appointment.appointmentTime || "—"}</span>
                  <span><DashboardIcon name="message" /> {appointment.patientEmail || "—"}</span>
                  <span><DashboardIcon name="users" /> {appointment.patientPhone || "—"}</span>
                  <span><DashboardIcon name="hospital" /> {appointment.clinic?.name || "Clinic not attached"}</span>
                </div>

                <div className="dashboard-record-grid">
                  <span><strong>Age:</strong> {appointment.patientAge || "—"}</span>
                  <span><strong>Gender:</strong> {appointment.patientGender || "—"}</span>
                  <span><strong>Reason:</strong> {appointment.reason || "—"}</span>
                  <span><strong>Payment:</strong> {appointment.paymentStatus || "—"}</span>
                </div>

                {appointment.notes ? (
                  <p className="dashboard-record-note">{appointment.notes}</p>
                ) : null}

                <div className="dashboard-action-row">
                  {[
                    "Approved",
                    "Completed",
                    "Cancelled",
                  ].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`dashboard-secondary-action ${status === "Cancelled" ? "danger" : ""}`}
                      disabled={updatingAppointmentId === appointment._id || appointment.status === status}
                      onClick={() => handleAppointmentStatus(appointment, status)}
                    >
                      {updatingAppointmentId === appointment._id && appointment.status !== status
                        ? "Updating..."
                        : status}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="dashboard-secondary-action"
                    onClick={() => {
                      setPatientSearch(appointment.patientName || "");
                      setSelectedPatientKey(patientKey(appointment));
                      scrollTo(patientSectionRef);
                    }}
                  >
                    Patient History
                  </button>
                  <PrescriptionPrintButton appointment={appointment} compact />
                </div>
              </article>
            ))
          ) : (
            <p className="dashboard-empty-state">No appointments match the selected filters.</p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Doctor & Clinic Workload">
        <div className="dashboard-performance-grid">
          {doctors.slice(0, 6).map((doctor) => {
            const stat = doctorStats.get(String(doctor._id)) || {
              appointments: 0,
              patients: new Set(),
            };

            return (
              <article key={doctor._id} className="dashboard-performance-card">
                <span className="dashboard-icon-bubble">
                  <DashboardIcon name="stetho" />
                </span>
                <h3>{doctor.name}</h3>
                <p>{doctor.specialization}</p>
                <div className="dashboard-metric-list" style={{ marginTop: 18 }}>
                  <div className="dashboard-metric-row">
                    <span>Patients</span>
                    <strong>{stat.patients.size}</strong>
                  </div>
                  <div className="dashboard-metric-row">
                    <span>Appointments</span>
                    <strong>{stat.appointments}</strong>
                  </div>
                  <div className="dashboard-metric-row">
                    <span>Completed</span>
                    <strong>{stat.completed}</strong>
                  </div>
                </div>
              </article>
            );
          })}

          {clinics.slice(0, 6).map((clinic) => {
            const stat = clinicStats.get(String(clinic._id)) || {
              doctors: clinic.doctors?.length || 0,
              appointments: 0,
              patients: new Set(),
            };

            return (
              <article key={`clinic-${clinic._id}`} className="dashboard-performance-card">
                <span className="dashboard-icon-bubble">
                  <DashboardIcon name="hospital" />
                </span>
                <h3>{clinic.name}</h3>
                <p>{clinic.city}, {clinic.state}</p>
                <div className="dashboard-metric-list" style={{ marginTop: 18 }}>
                  <div className="dashboard-metric-row">
                    <span>Doctors</span>
                    <strong>{stat.doctors}</strong>
                  </div>
                  <div className="dashboard-metric-row">
                    <span>Patients</span>
                    <strong>{stat.patients.size}</strong>
                  </div>
                  <div className="dashboard-metric-row">
                    <span>Appointments</span>
                    <strong>{stat.appointments}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
