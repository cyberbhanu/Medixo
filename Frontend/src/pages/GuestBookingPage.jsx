import { useState } from "react";
import Navbar from "../components/Navbar";
import { accessGuestBooking, updateGuestBooking } from "../api";
import "../styles/dashboard.css";

export default function GuestBookingPage() {
  const [credentials, setCredentials] = useState({ bookingReference: "", bookingPassword: "" });
  const [guestToken, setGuestToken] = useState("");
  const [appointment, setAppointment] = useState(null);
  const [reschedule, setReschedule] = useState({ appointmentDate: "", appointmentTime: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAccess = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await accessGuestBooking(credentials.bookingReference, credentials.bookingPassword);
      setGuestToken(result.guestToken);
      setAppointment(result.appointment);
      setReschedule({
        appointmentDate: result.appointment.appointmentDate || "",
        appointmentTime: result.appointment.appointmentTime || "",
      });
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to open this booking");
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (payload, message) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await updateGuestBooking(appointment._id, guestToken, payload);
      setAppointment(result.appointment);
      setSuccess(message);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to update this booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="doctor-profile-page shell">
        <section className="dashboard-form-card guest-booking-page-card">
          <div className="doctor-profile-section-header">
            <h1>My Booking</h1>
            <p>Enter the booking ID and password you received after booking your appointment.</p>
          </div>

          {error ? <div className="dashboard-banner error">{error}</div> : null}
          {success ? <div className="dashboard-banner success">{success}</div> : null}

          {!appointment ? (
            <form onSubmit={handleAccess} className="dashboard-form-grid">
              <label className="dashboard-input-group">
                <span>Booking ID</span>
                <input required value={credentials.bookingReference} onChange={(event) => setCredentials({ ...credentials, bookingReference: event.target.value })} placeholder="MX-..." />
              </label>
              <label className="dashboard-input-group">
                <span>Booking password</span>
                <input required value={credentials.bookingPassword} onChange={(event) => setCredentials({ ...credentials, bookingPassword: event.target.value })} placeholder="8-character password" />
              </label>
              <div className="dashboard-form-actions full-width">
                <button type="submit" className="dashboard-primary-action" disabled={loading}>{loading ? "Opening..." : "View Booking"}</button>
              </div>
            </form>
          ) : (
            <>
              <div className="guest-booking-status-row">
                <span className="dashboard-inline-badge">{appointment.status}</span>
                <strong>{appointment.bookingReference}</strong>
              </div>
              <div className="guest-booking-details">
                <div><span>Doctor</span><strong>{appointment.doctorId?.name || "Assigned doctor"}</strong></div>
                <div><span>Patient</span><strong>{appointment.patientName}</strong></div>
                <div><span>Queue</span><strong>#{appointment.queueNumber || "-"} of {appointment.dailyQueueSize || 0}</strong></div>
                <div><span>Patients ahead</span><strong>{appointment.patientsAhead || "Next in queue"}</strong></div>
                <div><span>Date</span><strong>{appointment.appointmentDate}</strong></div>
                <div><span>Time</span><strong>{appointment.appointmentTime}</strong></div>
              </div>

              {appointment.status !== "Cancelled" && appointment.status !== "Completed" ? (
                <div className="guest-booking-actions">
                  <h2>Manage Booking</h2>
                  <div className="dashboard-form-grid">
                    <label className="dashboard-input-group">
                      <span>New date</span>
                      <input type="date" value={reschedule.appointmentDate} onChange={(event) => setReschedule({ ...reschedule, appointmentDate: event.target.value })} />
                    </label>
                    <label className="dashboard-input-group">
                      <span>New time</span>
                      <input type="time" value={reschedule.appointmentTime} onChange={(event) => setReschedule({ ...reschedule, appointmentTime: event.target.value })} />
                    </label>
                    <div className="dashboard-form-actions full-width">
                      <button type="button" className="dashboard-primary-action" disabled={loading} onClick={() => updateBooking(reschedule, "Booking rescheduled successfully")}>Reschedule</button>
                      <button type="button" className="dashboard-secondary-action" disabled={loading} onClick={() => updateBooking({ status: "Cancelled" }, "Booking cancelled")}>Cancel Booking</button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
    </>
  );
}
