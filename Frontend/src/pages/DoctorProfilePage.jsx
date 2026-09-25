import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getDoctorById, createAppointment, createGuestAppointment } from "../api";
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
  const [slotConflict, setSlotConflict] = useState(false);
  const [guestBooking, setGuestBooking] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
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
    setSlotConflict(false);

    try {
      const appointmentData = {
        doctorId: doctor._id,
        type: "doctor",
        ...form,
        patientAge: Number(form.patientAge),
      };
      const bookingResponse = user
        ? await createAppointment(appointmentData)
        : await createGuestAppointment(appointmentData);
      setSuccess("Appointment booked successfully");
      setGuestBooking(user ? null : bookingResponse);
      setBookingComplete(Boolean(user));
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
      if (err.response?.status === 409) {
        setSlotConflict(true);
      }
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
                {doctor.locationUrl ? (
                  <a className="dashboard-inline-badge doctor-map-link" href={doctor.locationUrl} target="_blank" rel="noreferrer">
                    {doctor.location} · Open map
                  </a>
                ) : <span className="dashboard-inline-badge">{doctor.location}</span>}
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
                    : "Book directly without creating an account. You will receive a booking ID and password."}
                </p>
              </div>
              {error ? <div className="dashboard-banner error">{error}</div> : null}
              {success ? <div className="dashboard-banner success">{success}</div> : null}
              {guestBooking ? (
                <div className="guest-booking-confirmation">
                  <h3>Keep these booking details</h3>
                  <p>Use the Patient Login ID and password to open the Patient Dashboard, or use My Booking to manage this appointment directly.</p>
                  <div className="guest-booking-credentials">
                    <div><span>Booking ID</span><strong>{guestBooking.bookingReference}</strong></div>
                    <div><span>Password</span><strong>{guestBooking.bookingPassword}</strong></div>
                    <div><span>Queue</span><strong>#{guestBooking.appointment?.queueNumber || "-"}</strong></div>
                  </div>
                  <div className="guest-booking-credentials">
                    <div><span>Patient Login ID</span><strong>{guestBooking.patientLoginId}</strong></div>
                    <div><span>Patient Login Password</span><strong>{guestBooking.patientLoginPassword || "Use your existing patient password"}</strong></div>
                  </div>
                  <p>{guestBooking.patientAccountExists ? "This email already has a patient account, so use its existing password to sign in." : "Use the Patient Login section with the Patient Login ID and password above."}</p>
                  <button type="button" className="dashboard-primary-action" onClick={() => navigate("/my-booking")}>Open My Booking</button>
                </div>
              ) : bookingComplete ? (
                <div className="guest-booking-confirmation">
                  <h3>Appointment booked successfully</h3>
                  <p>Your appointment request has been sent to the doctor. You can follow its status from your Patient Dashboard.</p>
                  <button type="button" className="dashboard-primary-action" onClick={() => { setBookingComplete(false); setSuccess(""); }}>Book another appointment</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="dashboard-form-grid">
                  <label className="dashboard-input-group">
                    <span>Your name</span>
                    <input
                      required
                      value={form.patientName}
                      onChange={(event) => setForm({ ...form, patientName: event.target.value })}
                      placeholder="Full name"
                      readOnly={isLoggedIn}
                    />
                  </label>
                  {!isLoggedIn ? (
                    <label className="dashboard-input-group">
                        <span>Email</span>
                        <input required type="email" value={form.patientEmail} onChange={(event) => setForm({ ...form, patientEmail: event.target.value })} placeholder="you@example.com" />
                      </label>
                  ) : null}
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
                    <input
                      required
                      type="date"
                      value={form.appointmentDate}
                      onChange={(event) => {
                        setSlotConflict(false);
                        setError("");
                        setForm({ ...form, appointmentDate: event.target.value });
                      }}
                    />
                  </label>
                  <label className={`dashboard-input-group ${slotConflict ? "has-slot-conflict" : ""}`}>
                    <span>Appointment time</span>
                    <input
                      required
                      type="time"
                      value={form.appointmentTime}
                      aria-invalid={slotConflict}
                      aria-describedby={slotConflict ? "appointment-time-conflict" : undefined}
                      onChange={(event) => {
                        setSlotConflict(false);
                        setError("");
                        setForm({ ...form, appointmentTime: event.target.value });
                      }}
                    />
                    {slotConflict ? (
                      <small id="appointment-time-conflict" className="slot-conflict-message">
                        This time is already booked. Please choose another time.
                      </small>
                    ) : null}
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
