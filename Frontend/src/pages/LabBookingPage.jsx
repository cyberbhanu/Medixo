import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createAppointment, createGuestAppointment, getLabById } from "../api";
import { getStoredUser } from "../utils/auth";
import "../styles/dashboard.css";

const todayDate = () => new Date().toISOString().slice(0, 10);

const emptyForm = (user) => ({
  patientName: user?.name || "",
  patientEmail: user?.email || "",
  patientPhone: "",
  patientAge: "",
  patientGender: "Other",
  appointmentDate: "",
  appointmentTime: "",
  testName: "",
  notes: "",
});

export default function LabBookingPage() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [lab, setLab] = useState(null);
  const [form, setForm] = useState(() => emptyForm(user));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [guestBooking, setGuestBooking] = useState(null);

  useEffect(() => {
    let active = true;
    getLabById(resourceId)
      .then((data) => {
        if (active) {
          setLab(data);
          setForm((current) => ({ ...current, testName: current.testName || data.availableTests?.[0]?.name || "" }));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.error || "Unable to load laboratory details");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [resourceId]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!lab?._id) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const appointmentData = {
        type: "lab",
        labId: lab._id,
        ...form,
        reason: form.testName || "Laboratory test",
        patientAge: Number(form.patientAge),
      };
      const bookingResponse = user
        ? await createAppointment(appointmentData)
        : await createGuestAppointment(appointmentData);

      setSuccess("Laboratory test booking created successfully.");
      setGuestBooking(user ? null : bookingResponse);
      setForm(emptyForm(user));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to book this laboratory test");
    } finally {
      setSaving(false);
    }
  };

  const tests = (lab?.availableTests || []).filter((test) => test?.name);

  return (
    <>
      <Navbar />
      <main className="doctor-profile-page shell">
        <button type="button" className="resource-back-button" onClick={() => navigate(-1)}>Back</button>
        {loading ? <p>Loading laboratory details...</p> : null}
        {error && !lab ? <div className="dashboard-banner error">{error}</div> : null}
        {lab ? (
          <>
            <section className="dashboard-form-card doctor-profile-hero-card">
              <div className="doctor-profile-identity">
                {lab.logo ? <img src={lab.logo} alt={lab.name} className="doctor-profile-photo" /> : <div className="doctor-profile-photo doctor-profile-photo-fallback">{lab.name?.charAt(0) || "L"}</div>}
                <div>
                  <span className="resource-eyebrow">Laboratory</span>
                  <h1>{lab.name}</h1>
                  <p>{lab.address || lab.location || "Location details will be updated soon"}</p>
                </div>
              </div>
              <div className="doctor-profile-badge-row">
                {lab.mapUrl ? <a className="dashboard-inline-badge doctor-map-link" href={lab.mapUrl} target="_blank" rel="noreferrer">Open map</a> : null}
                <span className="dashboard-inline-badge">{lab.homeSampleCollection ? "Home collection" : "Center visit"}</span>
                <Link to="/lab-login" className="dashboard-inline-badge">Laboratory login</Link>
              </div>
            </section>

            <section className="dashboard-form-card doctor-profile-booking-card">
              <div className="doctor-profile-section-header">
                <h2>Book a laboratory test</h2>
                <p>{user ? "Choose a test and appointment time for your laboratory visit." : "Book directly without creating an account. You will receive a booking ID and password."}</p>
              </div>
              {error ? <div className="dashboard-banner error">{error}</div> : null}
              {success ? <div className="dashboard-banner success">{success}</div> : null}
              {guestBooking ? (
                <div className="guest-booking-confirmation">
                  <h3>Keep these booking details</h3>
                  <p>Use these credentials in Patient Login or open My Booking to manage this laboratory appointment.</p>
                  <div className="guest-booking-credentials">
                    <div><span>Booking ID</span><strong>{guestBooking.bookingReference}</strong></div>
                    <div><span>Password</span><strong>{guestBooking.bookingPassword}</strong></div>
                    <div><span>Queue</span><strong>#{guestBooking.appointment?.queueNumber || "-"}</strong></div>
                  </div>
                  <div className="guest-booking-credentials">
                    <div><span>Patient Login ID</span><strong>{guestBooking.patientLoginId}</strong></div>
                    <div><span>Patient Login Password</span><strong>{guestBooking.patientLoginPassword || "Use your existing patient password"}</strong></div>
                  </div>
                  <div className="dashboard-form-actions">
                    <Link to="/my-booking" className="dashboard-primary-action">Open My Booking</Link>
                    <Link to="/login" className="dashboard-secondary-action">Patient Login</Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="dashboard-form-grid">
                  <label className="dashboard-input-group full-width"><span>Test</span>{tests.length ? <select required value={form.testName} onChange={(event) => updateField("testName", event.target.value)}><option value="">Choose a test</option>{tests.map((test) => <option key={test.name} value={test.name}>{test.name}{test.price ? ` - Rs. ${test.price}` : ""}</option>)}</select> : <input required value={form.testName} onChange={(event) => updateField("testName", event.target.value)} placeholder="Enter the test name" />}</label>
                  <label className="dashboard-input-group"><span>Your name</span><input required value={form.patientName} readOnly={Boolean(user)} onChange={(event) => updateField("patientName", event.target.value)} placeholder="Full name" /></label>
                  {!user ? <label className="dashboard-input-group"><span>Email</span><input required type="email" value={form.patientEmail} onChange={(event) => updateField("patientEmail", event.target.value)} placeholder="you@example.com" /></label> : null}
                  <label className="dashboard-input-group"><span>Phone</span><input required value={form.patientPhone} onChange={(event) => updateField("patientPhone", event.target.value)} placeholder="9876543210" /></label>
                  <label className="dashboard-input-group"><span>Age</span><input required type="number" min="1" max="120" value={form.patientAge} onChange={(event) => updateField("patientAge", event.target.value)} placeholder="28" /></label>
                  <label className="dashboard-input-group"><span>Gender</span><select value={form.patientGender} onChange={(event) => updateField("patientGender", event.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></label>
                  <label className="dashboard-input-group"><span>Appointment date</span><input required type="date" min={todayDate()} value={form.appointmentDate} onChange={(event) => updateField("appointmentDate", event.target.value)} /></label>
                  <label className="dashboard-input-group"><span>Appointment time</span><input required type="time" value={form.appointmentTime} onChange={(event) => updateField("appointmentTime", event.target.value)} /></label>
                  <label className="dashboard-input-group full-width"><span>Notes</span><textarea rows="4" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Add collection or preparation details" /></label>
                  <div className="dashboard-form-actions full-width"><button type="submit" className="dashboard-primary-action" disabled={saving}>{saving ? "Booking..." : "Book Test"}</button></div>
                </form>
              )}
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
