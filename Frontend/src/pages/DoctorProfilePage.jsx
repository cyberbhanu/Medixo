import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getDoctorById, createAppointment } from "../api";
import { getStoredUser } from "../utils/auth";
import "../styles/dashboard.css";

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

  const isLoggedIn = Boolean(user);

  return (
    <>
      <Navbar />
      <main className="doctor-profile-page shell">
        {loading ? (
          <p>Loading doctor profile...</p>
        ) : error && !doctor ? (
          <p>{error}</p>
        ) : doctor ? (
          <>
            <section className="dashboard-form-card doctor-profile-hero-card">
              <div className="doctor-profile-identity">
                {doctor.profileImage ? (
                  <img src={doctor.profileImage} alt={doctor.name} className="doctor-profile-photo" loading="lazy" />
                ) : (
                  <div className="doctor-profile-photo doctor-profile-photo-fallback">
                    {doctor.name?.charAt(0) || "D"}
                  </div>
                )}
                <div>
                  <h1>Dr. {doctor.name}</h1>
                  <p>{doctor.specialization}</p>
                </div>
              </div>
              <div className="doctor-profile-badge-row">
                <span className="dashboard-inline-badge">{doctor.location}</span>
                <span className="dashboard-inline-badge">{doctor.experience}+ yrs</span>
                <span className="dashboard-inline-badge">Rs. {doctor.fees}</span>
              </div>
            </section>

            {doctor.detailsSubmitted && doctor.hospitalClinicDetails ? (
              <section className="dashboard-form-card doctor-profile-details-card">
                <div className="doctor-profile-section-header">
                  <div>
                    <h2>Hospital & Clinic Details</h2>
                    <p>
                      Patients can see the care facility details and services offered before booking.
                    </p>
                  </div>
                </div>

                {doctor.hospitalClinicDetails.clinicImage && (
                  <img
                    src={doctor.hospitalClinicDetails.clinicImage}
                    alt={`${doctor.name} clinic`}
                    className="doctor-profile-clinic-image"
                    loading="lazy"
                  />
                )}

                <div className="doctor-profile-facility-grid">
                  {(doctor.hospitalClinicDetails.hospitalName || doctor.hospitalClinicDetails.clinicName) && (
                    <div className="doctor-profile-facility-card">
                      <strong>Facility</strong>
                      <div>{doctor.hospitalClinicDetails.clinicName || doctor.hospitalClinicDetails.hospitalName}</div>
                      {doctor.hospitalClinicDetails.hospitalName && doctor.hospitalClinicDetails.clinicName && (
                        <div className="doctor-profile-muted-text">{doctor.hospitalClinicDetails.hospitalName}</div>
                      )}
                    </div>
                  )}

                  {doctor.hospitalClinicDetails.clinicAddress && (
                    <div className="doctor-profile-facility-card">
                      <strong>Address</strong>
                      <div>{doctor.hospitalClinicDetails.clinicAddress}</div>
                    </div>
                  )}

                  {doctor.hospitalClinicDetails.phoneNumber && (
                    <div className="doctor-profile-facility-card">
                      <strong>Phone</strong>
                      <a href={`tel:${doctor.hospitalClinicDetails.phoneNumber}`}>
                        {doctor.hospitalClinicDetails.phoneNumber}
                      </a>
                    </div>
                  )}

                  {doctor.hospitalClinicDetails.timings && (
                    <div className="doctor-profile-facility-card">
                      <strong>Timings</strong>
                      <div>{doctor.hospitalClinicDetails.timings}</div>
                    </div>
                  )}
                </div>

                {(doctor.hospitalClinicDetails.licenseNumber || doctor.hospitalClinicDetails.registrationNumber) && (
                  <div className="doctor-profile-facility-card">
                    <strong>Professional Details</strong>
                    {doctor.hospitalClinicDetails.licenseNumber && <div>License: {doctor.hospitalClinicDetails.licenseNumber}</div>}
                    {doctor.hospitalClinicDetails.registrationNumber && <div>Registration: {doctor.hospitalClinicDetails.registrationNumber}</div>}
                  </div>
                )}

                {doctor.hospitalClinicDetails.services?.length > 0 && (
                  <div>
                    <h3 className="doctor-profile-subtitle">Facilities & Services</h3>
                    <div className="doctor-profile-services">
                      {doctor.hospitalClinicDetails.services.map((service, index) => (
                        <span key={`${service}-${index}`} className="dashboard-inline-badge">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            <section className="dashboard-form-card doctor-profile-booking-card">
              <div className="doctor-profile-section-header">
                <h2>Book Appointment</h2>
                <p>
                  {isLoggedIn
                    ? `Fill in your details below to request an appointment with Dr. ${doctor.name}.`
                    : "Please log in to book an appointment with this doctor."}
                </p>
              </div>
              {error ? <div className="dashboard-banner error">{error}</div> : null}
              {success ? <div className="dashboard-banner success">{success}</div> : null}
              {isLoggedIn ? (
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
              ) : (
                <button type="button" className="dashboard-primary-action" onClick={() => navigate("/login")}>Login to Book Appointment</button>
              )}
            </section>
          </>
        ) : (
          <p>No doctor profile was found.</p>
        )}
      </main>
    </>
  );
}
