import { useEffect, useMemo, useRef, useState } from "react";
import { getAppointments, getDoctors, updateDoctor, adminCreateUser, deleteDoctor, uploadDoctorImage } from "../api";
import DashboardLayout, {
  DashboardIcon,
  DashboardSection,
} from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";

const initialDoctorForm = {
  name: "",
  email: "",
  password: "",
  role: "doctor",
  specialization: "",
  experience: "",
  location: "",
  fees: "",
  profileImage: "",
};

const formatDoctorSummary = (doctor) =>
  `${doctor.specialization} - ${doctor.experience} yrs - Rs. ${doctor.fees}`;

const downloadAppointmentsCsv = (appointments, selectedDoctor) => {
  const rows = [
    [
      "Doctor Name",
      "Doctor Specialization",
      "Patient Name",
      "Patient Email",
      "Patient Phone",
      "Patient Age",
      "Patient Gender",
      "Appointment Date",
      "Appointment Time",
      "Reason",
      "Status",
      "Notes",
    ],
    ...appointments.map((appointment) => [
      appointment.doctorId?.name || "",
      appointment.doctorId?.specialization || "",
      appointment.patientName || "",
      appointment.patientEmail || "",
      appointment.patientPhone || "",
      appointment.patientAge || "",
      appointment.patientGender || "",
      appointment.appointmentDate || "",
      appointment.appointmentTime || "",
      appointment.reason || "",
      appointment.status || "",
      appointment.notes || "",
    ]),
  ];

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const doctorSlug = selectedDoctor?.name?.replace(/\s+/g, "-").toLowerCase() || "all-doctors";

  link.href = url;
  link.download = `appointments-${doctorSlug}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

export default function AdminDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Admin";
  const doctorFormRef = useRef(null);

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorForm, setDoctorForm] = useState(initialDoctorForm);
  const [editingDoctorId, setEditingDoctorId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [uploadingDoctorImage, setUploadingDoctorImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [doctorData, appointmentData] = await Promise.all([
        getDoctors(),
        getAppointments(),
      ]);

      setDoctors(doctorData);
      setAppointments(appointmentData);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const selectedDoctor = doctors.find((doctor) => doctor._id === selectedDoctorId) || null;
  const filteredAppointments = useMemo(() => {
    if (!selectedDoctorId) {
      return appointments;
    }

    return appointments.filter((appointment) => appointment.doctorId?._id === selectedDoctorId);
  }, [appointments, selectedDoctorId]);

  const scrollToDoctorForm = () => {
    doctorFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetDoctorForm = () => {
    setDoctorForm(initialDoctorForm);
    setEditingDoctorId("");
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
      };

      if (editingDoctorId) {
        await updateDoctor(editingDoctorId, payload);
        setSuccess("Doctor details updated successfully");
      } else {
        await adminCreateUser({ ...payload, role: doctorForm.role });
        setSuccess(`${doctorForm.role === "doctor" ? "Doctor" : "Lab"} added successfully`);
      }

      resetDoctorForm();
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to save doctor details");
    } finally {
      setSavingDoctor(false);
    }
  };

  const startDoctorEdit = (doctor) => {
    setEditingDoctorId(doctor._id);
    setDoctorForm({
      name: doctor.name,
      email: doctor.email || "",
      password: "",
      specialization: doctor.specialization,
      experience: String(doctor.experience),
      location: doctor.location,
      fees: String(doctor.fees),
      profileImage: doctor.profileImage || "",
    });
    setSuccess("");
    setError("");
    scrollToDoctorForm();
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor and their login access?")) return;
    setError("");
    setSuccess("");
    try {
      await deleteDoctor(doctorId);
      setSuccess("Doctor and login deleted successfully");
      await loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete doctor");
    }
  };

  const handleDoctorImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingDoctorImage(true);
    setError("");
    setSuccess("");

    try {
      const data = await uploadDoctorImage(file);
      setDoctorForm((currentForm) => ({
        ...currentForm,
        profileImage: data.imageUrl || "",
      }));
      setSuccess("Doctor image uploaded successfully");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to upload doctor image");
    } finally {
      setUploadingDoctorImage(false);
      event.target.value = "";
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (appointment) => appointment.appointmentDate === today
  ).length;
  const scheduledAppointments = appointments.filter(
    (appointment) => appointment.status === "Scheduled"
  ).length;

  const stats = [
    {
      icon: "users",
      value: String(doctors.length),
      label: "Doctors Managed",
      note: "Add and update doctor availability details",
    },
    {
      icon: "calendar",
      value: String(appointments.length),
      label: "Appointments Visible",
      note: "Admin can review every doctor booking from one place",
    },
    {
      icon: "clock",
      value: String(todayAppointments),
      label: "Today's Bookings",
      note: "Appointments scheduled for today",
    },
    {
      icon: "shield",
      value: String(scheduledAppointments),
      label: "Scheduled Queue",
      note: "Bookings waiting to be completed",
    },
  ];

  const recentAdminItems = [
    ...doctors.slice(0, 2).map((doctor) => `Doctor updated: ${doctor.name}`),
    ...appointments.slice(0, 2).map(
      (appointment) =>
        `${appointment.patientName} booked with ${appointment.doctorId?.name || "Doctor"}`
    ),
  ];

  return (
    <DashboardLayout
      role="Admin Dashboard"
      title={`Control center for ${firstName}`}
      subtitle="Manage doctor profiles, monitor appointments for every doctor, and export Excel-friendly patient booking lists without handling patient booking forms here."
      chips={["Doctor management", "Appointment visibility", "Excel-ready export"]}
      stats={stats}
      quickActions={[
        {
          icon: "plus",
          label: "New Doctor",
          variant: "primary",
          onClick: () => {
            resetDoctorForm();
            scrollToDoctorForm();
          },
        },
        {
          icon: "file",
          label: "Export List",
          onClick: () => downloadAppointmentsCsv(filteredAppointments, selectedDoctor),
        },
        {
          icon: "chart",
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
                <p>Patients now book appointments from their own dashboard with full detail fields.</p>
              </div>
              <div className="dashboard-mini-row">
                <span className="dashboard-mini-dot" />
                <p>Use the doctor filter below to review one doctor's appointment list at a time.</p>
              </div>
              <div className="dashboard-mini-row">
                <span className="dashboard-mini-dot" />
                <p>Export creates a CSV file that opens directly in Excel for follow-up and reporting.</p>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection title="Recent Updates">
            <div className="dashboard-mini-list">
              {recentAdminItems.length ? (
                recentAdminItems.map((item) => (
                  <div key={item} className="dashboard-mini-row">
                    <span className="dashboard-mini-dot urgent" />
                    <p>{item}</p>
                  </div>
                ))
              ) : (
                <p className="dashboard-empty-state">No activity yet. Add a doctor to get started.</p>
              )}
            </div>
          </DashboardSection>
        </>
      }
    >
      {error ? <div className="dashboard-banner error">{error}</div> : null}
      {success ? <div className="dashboard-banner success">{success}</div> : null}

      <DashboardSection title="Provider Accounts Manager" action={editingDoctorId ? "Editing profile" : "Create profile"}>
        <div className="dashboard-admin-grid">
          <form ref={doctorFormRef} className="dashboard-form-card" onSubmit={handleDoctorSubmit}>
            <div className="dashboard-form-grid">
              <label className="dashboard-input-group">
                <span>Doctor name</span>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(event) => setDoctorForm({ ...doctorForm, name: event.target.value })}
                  placeholder="Dr. Arjun Sharma"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Email Login</span>
                <input
                  type="email"
                  value={doctorForm.email}
                  onChange={(event) => setDoctorForm({ ...doctorForm, email: event.target.value })}
                  placeholder="doctor@medixo.com"
                  required={!editingDoctorId}
                  disabled={!!editingDoctorId}
                />
              </label>

              {!editingDoctorId && (
                <label className="dashboard-input-group">
                  <span>Password</span>
                  <input
                    type="password"
                    value={doctorForm.password}
                    onChange={(event) => setDoctorForm({ ...doctorForm, password: event.target.value })}
                    placeholder="******"
                    required={!editingDoctorId}
                  />
                </label>
              )}

              <label className="dashboard-input-group">
                <span>Specialization</span>
                <input
                  type="text"
                  value={doctorForm.specialization}
                  onChange={(event) =>
                    setDoctorForm({ ...doctorForm, specialization: event.target.value })
                  }
                  placeholder="Cardiology"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Experience (years)</span>
                <input
                  type="number"
                  min="0"
                  value={doctorForm.experience}
                  onChange={(event) =>
                    setDoctorForm({ ...doctorForm, experience: event.target.value })
                  }
                  placeholder="10"
                  required
                />
              </label>

              <label className="dashboard-input-group">
                <span>Account Type</span>
                <select
                  value={doctorForm.role || "doctor"}
                  onChange={(event) => setDoctorForm({ ...doctorForm, role: event.target.value })}
                  disabled={!!editingDoctorId}
                >
                  <option value="doctor">Doctor</option>
                  <option value="laboratory">Lab</option>
                </select>
              </label>

              <label className="dashboard-input-group">
                <span>Location</span>
                <input
                  type="text"
                  value={doctorForm.location}
                  onChange={(event) => setDoctorForm({ ...doctorForm, location: event.target.value })}
                  placeholder="Delhi"
                  required
                />
              </label>

              {doctorForm.role === "doctor" && (
                <>
                  <label className="dashboard-input-group">
                    <span>Consultation fee</span>
                    <input
                      type="number"
                      min="0"
                      value={doctorForm.fees}
                      onChange={(event) => setDoctorForm({ ...doctorForm, fees: event.target.value })}
                      placeholder="800"
                      required
                    />
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
                          <span>{uploadingDoctorImage ? "Uploading image..." : "Upload doctor image"}</span>
                        )}
                      </label>
                      <label className="dashboard-input-group dashboard-url-input">
                        <span>Or paste image URL</span>
                        <input
                          type="url"
                          value={doctorForm.profileImage}
                          onChange={(event) => setDoctorForm({ ...doctorForm, profileImage: event.target.value })}
                          placeholder="https://example.com/doctor.jpg"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-primary-action" disabled={savingDoctor}>
                {savingDoctor
                  ? "Saving..."
                  : editingDoctorId
                    ? "Update Profile"
                    : `Add ${doctorForm.role === "doctor" ? "Doctor" : "Lab"}`}
              </button>
              <button type="button" className="dashboard-secondary-action" onClick={resetDoctorForm}>
                Clear Form
              </button>
            </div>
          </form>

          <div className="dashboard-admin-list">
            {loading ? (
              <p className="dashboard-empty-state">Loading doctors...</p>
            ) : doctors.length ? (
              doctors.map((doctor) => (
                <article key={doctor._id} className="dashboard-admin-record">
                  <div className="dashboard-record-header">
                    <div className="dashboard-record-identity">
                      {doctor.profileImage ? (
                        <img src={doctor.profileImage} alt={doctor.name} className="dashboard-record-avatar" />
                      ) : (
                        <span className="dashboard-record-avatar fallback">{doctor.name?.charAt(0) || "D"}</span>
                      )}
                      <div>
                        <h3>{doctor.name}</h3>
                        <p>{formatDoctorSummary(doctor)}</p>
                      </div>
                    </div>
                    <span className="dashboard-inline-badge">{doctor.location}</span>
                  </div>

                  <div className="dashboard-record-meta">
                    <span>
                      <DashboardIcon name="stetho" /> {doctor.specialization}
                    </span>
                    <span>
                      <DashboardIcon name="clock" /> {doctor.experience} years
                    </span>
                    <span>
                      <DashboardIcon name="rupee" /> Rs. {doctor.fees}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                    <button 
                      type="button" 
                      className="dashboard-secondary-action"
                      onClick={() => startDoctorEdit(doctor)}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      Edit Profile
                    </button>
                    <button 
                      type="button" 
                      className="dashboard-secondary-action"
                      onClick={() => handleDeleteDoctor(doctor._id)}
                      style={{ flex: 1, justifyContent: "center", color: "#c62828", borderColor: "#ef5350", backgroundColor: "#fffafa" }}
                    >
                      Delete Access
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="dashboard-empty-state">No doctor records yet. Add your first doctor from the form.</p>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title="Appointment Review" action="Admin view only">
        <div className="dashboard-admin-list">
          <div className="dashboard-filter-row">
            <label className="dashboard-input-group">
              <span>Filter by doctor</span>
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(event.target.value)}
              >
                <option value="">All doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="dashboard-secondary-action"
              onClick={() => downloadAppointmentsCsv(filteredAppointments, selectedDoctor)}
            >
              Export Doctor List
            </button>
          </div>

          {loading ? (
            <p className="dashboard-empty-state">Loading appointments...</p>
          ) : filteredAppointments.length ? (
            filteredAppointments.map((appointment) => (
              <article key={appointment._id} className="dashboard-admin-record">
                <div className="dashboard-record-header">
                  <div>
                    <h3>{appointment.patientName}</h3>
                    <p>{appointment.doctorId?.name || "Unknown Doctor"}</p>
                  </div>
                  <span className="dashboard-inline-badge">{appointment.status}</span>
                </div>

                <div className="dashboard-record-meta">
                  <span>
                    <DashboardIcon name="calendar" /> {appointment.appointmentDate}
                  </span>
                  <span>
                    <DashboardIcon name="clock" /> {appointment.appointmentTime}
                  </span>
                  <span>
                    <DashboardIcon name="message" /> {appointment.patientEmail}
                  </span>
                  <span>
                    <DashboardIcon name="users" /> {appointment.patientPhone}
                  </span>
                </div>

                <div className="dashboard-record-grid">
                  <span><strong>Age:</strong> {appointment.patientAge}</span>
                  <span><strong>Gender:</strong> {appointment.patientGender}</span>
                  <span><strong>Reason:</strong> {appointment.reason}</span>
                </div>

                {appointment.notes ? <p className="dashboard-record-note">{appointment.notes}</p> : null}
              </article>
            ))
          ) : (
            <p className="dashboard-empty-state">
              No appointments found{selectedDoctor ? ` for ${selectedDoctor.name}` : ""}.
            </p>
          )}
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
