import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getDoctorById, createAppointment } from "../api";
import { getStoredUser } from "../utils/auth";

export default function DoctorProfilePage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    patientName: user?.name || "",
    patientEmail: user?.email || "",
    patientPhone: "",
    patientAge: "",
    patientGender: "Other",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (!doctorId) return;

    const loadDoctor = async () => {
      setLoading(true);
      setError("");
      try {
        const matchedDoctor = await getDoctorById(doctorId);
        setDoctor(matchedDoctor);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load doctor profile");
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    };
    loadDoctor();
  }, [doctorId]);

  useEffect(() => {
    setForm((currentForm) => ({
      ...currentForm,
      patientName: user?.name || "",
      patientEmail: user?.email || "",
    }));
  }, [user?.email, user?.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!doctor?._id) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createAppointment({
        doctorId: doctor._id,
        type: "doctor",
        ...form,
        patientAge: Number(form.patientAge),
      });
      setSuccess("Appointment booked successfully");
      setForm({
        patientName: user?.name || "",
        patientEmail: user?.email || "",
        patientPhone: "",
        patientAge: "",
        patientGender: "Other",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
        notes: "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to book appointment");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="shell" style={{ padding: "48px 0" }}>
          <h2>Please log in to book an appointment.</h2>
          <button type="button" className="primary-button" onClick={() => navigate("/login")}>Go to Login</button>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="shell" style={{ padding: "48px 0", display: "grid", gap: "24px" }}>
        {loading ? (
          <p>Loading doctor profile...</p>
        ) : error && !doctor ? (
          <p>{error}</p>
        ) : doctor ? (
          <>
            <section className="dashboard-form-card" style={{ padding: "24px", display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
                {doctor.profileImage ? (
                  <img src={doctor.profileImage} alt={doctor.name} style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "16px" }} />
                ) : (
                  <div style={{ width: "140px", height: "140px", borderRadius: "16px", display: "grid", placeItems: "center", background: "#eaf3ff", color: "#0f7bf5", fontSize: "36px", fontWeight: 700 }}>
                    {doctor.name?.charAt(0) || "D"}
                  </div>
                )}
                <div>
                  <h1 style={{ margin: 0 }}>Dr. {doctor.name}</h1>
                  <p style={{ margin: "6px 0 0", color: "#4d5f80" }}>{doctor.specialization}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <span className="dashboard-inline-badge">{doctor.location}</span>
                <span className="dashboard-inline-badge">{doctor.experience}+ yrs</span>
                <span className="dashboard-inline-badge">₹{doctor.fees}</span>
              </div>
            </section>

            {doctor.detailsSubmitted && doctor.hospitalClinicDetails ? (
              <section className="dashboard-form-card" style={{ padding: "24px", display: "grid", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Hospital & Clinic Details</h2>
                    <p style={{ margin: "6px 0 0", color: "#4d5f80" }}>
                      Patients can see the care facility details and services offered before booking.
                    </p>
                  </div>
                </div>

                {doctor.hospitalClinicDetails.clinicImage && (
                  <img
                    src={doctor.hospitalClinicDetails.clinicImage}
                    alt={`${doctor.name} clinic`}
                    style={{ width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "16px" }}
                  />
                )}

                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {(doctor.hospitalClinicDetails.hospitalName || doctor.hospitalClinicDetails.clinicName) && (
                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#f7faff", border: "1px solid #e2ecff" }}>
                      <strong style={{ display: "block", marginBottom: "6px", color: "#0b5ed7" }}>Facility</strong>
                      <div>{doctor.hospitalClinicDetails.clinicName || doctor.hospitalClinicDetails.hospitalName}</div>
                      {doctor.hospitalClinicDetails.hospitalName && doctor.hospitalClinicDetails.clinicName && (
                        <div style={{ color: "#5b6b85", marginTop: "4px" }}>{doctor.hospitalClinicDetails.hospitalName}</div>
                      )}
                    </div>
                  )}

                  {doctor.hospitalClinicDetails.clinicAddress && (
                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#f7faff", border: "1px solid #e2ecff" }}>
                      <strong style={{ display: "block", marginBottom: "6px", color: "#0b5ed7" }}>Address</strong>
                      <div>{doctor.hospitalClinicDetails.clinicAddress}</div>
                    </div>
                  )}

                  {doctor.hospitalClinicDetails.phoneNumber && (
                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#f7faff", border: "1px solid #e2ecff" }}>
                      <strong style={{ display: "block", marginBottom: "6px", color: "#0b5ed7" }}>Phone</strong>
                      <a href={`tel:${doctor.hospitalClinicDetails.phoneNumber}`} style={{ color: "#0b5ed7" }}>
                        {doctor.hospitalClinicDetails.phoneNumber}
                      </a>
                    </div>
                  )}

                  {doctor.hospitalClinicDetails.timings && (
                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#f7faff", border: "1px solid #e2ecff" }}>
                      <strong style={{ display: "block", marginBottom: "6px", color: "#0b5ed7" }}>Timings</strong>
                      <div>{doctor.hospitalClinicDetails.timings}</div>
                    </div>
                  )}
                </div>

                {(doctor.hospitalClinicDetails.licenseNumber || doctor.hospitalClinicDetails.registrationNumber) && (
                  <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#f7faff", border: "1px solid #e2ecff" }}>
                    <strong style={{ display: "block", marginBottom: "6px", color: "#0b5ed7" }}>Professional Details</strong>
                    {doctor.hospitalClinicDetails.licenseNumber && <div>License: {doctor.hospitalClinicDetails.licenseNumber}</div>}
                    {doctor.hospitalClinicDetails.registrationNumber && <div>Registration: {doctor.hospitalClinicDetails.registrationNumber}</div>}
                  </div>
                )}

                {doctor.hospitalClinicDetails.services?.length > 0 && (
                  <div>
                    <h3 style={{ margin: "0 0 8px" }}>Facilities & Services</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {doctor.hospitalClinicDetails.services.map((service, index) => (
                        <span key={`${service}-${index}`} className="dashboard-inline-badge" style={{ background: "#eaf3ff", color: "#0b5ed7" }}>
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            <section className="dashboard-form-card" style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h2 style={{ margin: 0 }}>Book Appointment</h2>
                <p style={{ margin: "6px 0 0", color: "#4d5f80" }}>
                  Fill in your details below to request an appointment with Dr. {doctor.name}.
                </p>
              </div>
              {error ? <div className="dashboard-banner error">{error}</div> : null}
              {success ? <div className="dashboard-banner success">{success}</div> : null}
              <form onSubmit={handleSubmit} className="dashboard-form-grid">
                <label className="dashboard-input-group">
                  <span>Phone</span>
                  <input required value={form.patientPhone} onChange={(event) => setForm({ ...form, patientPhone: event.target.value })} placeholder="9876543210" />
                </label>
                <label className="dashboard-input-group">
                  <span>Age</span>
                  <input required type="number" min="1" value={form.patientAge} onChange={(event) => setForm({ ...form, patientAge: event.target.value })} placeholder="28" />
                </label>
                <label className="dashboard-input-group">
                  <span>Gender</span>
                  <select value={form.patientGender} onChange={(event) => setForm({ ...form, patientGender: event.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="dashboard-input-group">
                  <span>Appointment date</span>
                  <input required type="date" value={form.appointmentDate} onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })} />
                </label>
                <label className="dashboard-input-group">
                  <span>Appointment time</span>
                  <input required type="time" value={form.appointmentTime} onChange={(event) => setForm({ ...form, appointmentTime: event.target.value })} />
                </label>
                <label className="dashboard-input-group full-width">
                  <span>Reason</span>
                  <input required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Fever, follow-up, routine visit" />
                </label>
                <label className="dashboard-input-group full-width">
                  <span>Notes</span>
                  <textarea rows="4" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Add symptoms or details" />
                </label>
                <div className="dashboard-form-actions full-width">
                  <button type="submit" className="dashboard-primary-action" disabled={saving}>
                    {saving ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              </form>
            </section>
          </>
        ) : (
          <p>No doctor profile was found.</p>
        )}
      </main>
    </>
  );
}
