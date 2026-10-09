import { useEffect, useMemo, useState } from "react";
import { createAppointment, getAppointments, getDoctors, getLabs, updateAppointment } from "../api";
import DashboardLayout, { DashboardIcon, DashboardSection } from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";
import ManageAppointmentModal from "../components/ManageAppointmentModal";
import PrescriptionPrintButton from "../components/PrescriptionPrintButton";
import QueueTicketPrintButton from "../components/QueueTicketPrintButton";
import StaffBookingModal from "../components/StaffBookingModal";

const ACTIVE_STATUSES = ["Scheduled", "Approved", "Rescheduled"];
const getLocalDate = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 10);
};

const TODAY = getLocalDate();

const getAppointmentTimestamp = (appointment) => {
  const timestamp = new Date(
    `${appointment.appointmentDate}T${appointment.appointmentTime || "00:00"}:00`
  ).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const statusLabel = (status) => {
  if (status === "Approved") return "Checked in";
  if (status === "Scheduled") return "Waiting";
  return status;
};

export default function StaffDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Staff";
  const [appointments, setAppointments] = useState([]);
  const [labs, setLabs] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [dateScope, setDateScope] = useState("today");
  const [statusScope, setStatusScope] = useState("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [managingAppointment, setManagingAppointment] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingCredentials, setBookingCredentials] = useState(null);

  const loadDashboardData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const [appointmentData, labData, doctorData] = await Promise.all([getAppointments(), getLabs(), getDoctors()]);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      setLabs(Array.isArray(labData) ? labData : []);
      const assignedDoctorId = user?.doctorId?._id || user?.doctorId;
      const assignedClinicId = user?.clinicId?._id || user?.clinicId;
      const assignedHospitalId = user?.hospitalId?._id || user?.hospitalId;
      setDoctors((Array.isArray(doctorData) ? doctorData : []).filter((doctor) => {
        if (assignedDoctorId) return String(doctor._id) === String(assignedDoctorId);
        const clinicIds = [doctor.clinic, ...(doctor.clinics || [])].map((id) => String(id?._id || id));
        const hospitalIds = [doctor.hospital, ...(doctor.hospitals || [])].map((id) => String(id?._id || id));
        return (assignedClinicId && clinicIds.includes(String(assignedClinicId))) || (assignedHospitalId && hospitalIds.includes(String(assignedHospitalId)));
      }));
    } catch (requestError) {
      if (!silent) setError(requestError.response?.data?.error || "Failed to load staff data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!managingAppointment) loadDashboardData({ silent: true });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [managingAppointment]);

  const handleSaveAppointment = async (appointmentId, draft) => {
    try {
      const updated = await updateAppointment(appointmentId, draft);
      setAppointments((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setSuccess("Patient record and queue status updated.");
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to save appointment");
      setSuccess("");
      return false;
    }
  };

  const handleReferPatient = async (patientAppointment, referralDetails) => {
    try {
      await createAppointment({
        type: "lab",
        labId: referralDetails.labId,
        labReferral: patientAppointment._id,
        appointmentDate: referralDetails.appointmentDate,
        appointmentTime: referralDetails.appointmentTime,
        reason: referralDetails.reason,
        testName: referralDetails.reason,
        notes: `Referred by staff for: ${referralDetails.reason}`,
      });
      setSuccess("Patient successfully referred to the laboratory.");
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to refer patient to the laboratory");
      setSuccess("");
      return false;
    }
  };

  const handleBookAppointment = async (booking) => {
    try {
      const created = await createAppointment(booking);
      setBookingCredentials(created?.staffPatientCredentials || null);
      setSuccess(`Appointment booked successfully${created?.queueNumber ? `. Queue number: #${created.queueNumber}` : ""}.`);
      setError("");
      await loadDashboardData({ silent: true });
      return true;
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to book the appointment");
      setSuccess("");
      return false;
    }
  };

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.appointmentDate === TODAY),
    [appointments]
  );

  const visibleAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments
      .filter((appointment) => {
        if (dateScope === "today" && appointment.appointmentDate !== TODAY) return false;
        if (dateScope === "upcoming" && appointment.appointmentDate < TODAY) return false;
        if (statusScope === "active" && !ACTIVE_STATUSES.includes(appointment.status)) return false;
        if (statusScope !== "active" && statusScope !== "all" && appointment.status !== statusScope) return false;
        if (query) {
          const searchableText = [
            appointment.patientName,
            appointment.patientEmail,
            appointment.patientPhone,
            appointment.reason,
            appointment.doctorId?.name,
            appointment.clinic?.name,
          ].filter(Boolean).join(" ").toLowerCase();
          if (!searchableText.includes(query)) return false;
        }
        return true;
      })
      .sort((left, right) => {
        const queueDifference = (left.queueNumber || 9999) - (right.queueNumber || 9999);
        return queueDifference || getAppointmentTimestamp(left) - getAppointmentTimestamp(right);
      });
  }, [appointments, dateScope, search, statusScope]);

  const activeToday = todayAppointments.filter((appointment) => ACTIVE_STATUSES.includes(appointment.status));
  const checkedInToday = todayAppointments.filter((appointment) => appointment.status === "Approved");
  const completedToday = todayAppointments.filter((appointment) => appointment.status === "Completed");
  const stats = [
    { icon: "calendar", value: String(activeToday.length), label: "Open today", note: "Patients moving through the queue" },
    { icon: "users", value: String(new Set(todayAppointments.map((appointment) => appointment.patientEmail)).size), label: "Patients today", note: "Unique patient appointments" },
    { icon: "clock", value: String(checkedInToday.length), label: "Checked in", note: "Ready for the doctor" },
    { icon: "check", value: String(completedToday.length), label: "Completed", note: "Visits closed today" },
  ];

  return (
    <DashboardLayout
      role="Staff Dashboard"
      title={`Front desk queue for ${firstName}`}
      subtitle="Keep the clinic moving: confirm patients, manage the live queue, and send a clean patient record and blank prescription sheet to the doctor."
      chips={["Live queue", "Patient support", "Doctor handoff", "Printable records"]}
      stats={stats}
      quickActions={[
        { label: "Refresh Queue", icon: "refresh", variant: "primary", onClick: loadDashboardData },
        { label: "Book for Patient", icon: "calendar", variant: "primary", onClick: () => setBookingOpen(true) },
        { label: "Today's Queue", icon: "calendar", onClick: () => { setDateScope("today"); setStatusScope("active"); setSearch(""); } },
      ]}
      aside={
        <>
          <DashboardSection title="Front-desk flow">
            <div className="dashboard-mini-list">
              <div className="dashboard-mini-row"><span className="dashboard-mini-dot" /><p>Confirm patient details when they arrive.</p></div>
              <div className="dashboard-mini-row"><span className="dashboard-mini-dot" /><p>Set Checked in when the patient is ready for the doctor.</p></div>
              <div className="dashboard-mini-row"><span className="dashboard-mini-dot" /><p>Print the queue slip and blank Rx sheet for the doctor.</p></div>
              <div className="dashboard-mini-row"><span className="dashboard-mini-dot" /><p>Complete the visit only after the doctor finishes the record.</p></div>
            </div>
          </DashboardSection>
          <DashboardSection title="Queue health">
            <div className="dashboard-metric-list">
              <div className="dashboard-metric-row"><span>Waiting</span><strong>{todayAppointments.filter((item) => item.status === "Scheduled").length}</strong></div>
              <div className="dashboard-metric-row"><span>Checked in</span><strong>{checkedInToday.length}</strong></div>
              <div className="dashboard-metric-row"><span>Completed</span><strong>{completedToday.length}</strong></div>
            </div>
          </DashboardSection>
        </>
      }
    >
      {error ? <div className="dashboard-banner error">{error}</div> : null}
      {success ? <div className="dashboard-banner success">{success}</div> : null}

      <DashboardSection title="Staff booking" action="Book for patient" onActionClick={() => setBookingOpen(true)}>
        <p className="dashboard-section-description">Create a doctor appointment for a patient using one of your assigned doctors.</p>
      </DashboardSection>
      {bookingCredentials ? <div className="dashboard-banner success"><strong>Give these details to the patient:</strong> Patient ID: <strong>{bookingCredentials.patientLoginId}</strong> | Temporary password: <strong>{bookingCredentials.patientLoginPassword || "Use the patient’s existing password"}</strong> | Booking ID: <strong>{bookingCredentials.bookingReference}</strong> | Booking password: <strong>{bookingCredentials.bookingPassword}</strong>{bookingCredentials.existingPatientAccount ? " (existing patient account; login password was not changed)" : ""}</div> : null}

      <DashboardSection title="Patient queue" action="Refresh" onActionClick={loadDashboardData}>
        <div className="staff-queue-toolbar">
          <label className="dashboard-input-group"><span>Find patient</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, doctor or reason" /></label>
          <label className="dashboard-input-group"><span>Queue date</span><select value={dateScope} onChange={(event) => setDateScope(event.target.value)}><option value="today">Today</option><option value="upcoming">Today and upcoming</option><option value="all">All dates</option></select></label>
          <label className="dashboard-input-group"><span>Status</span><select value={statusScope} onChange={(event) => setStatusScope(event.target.value)}><option value="active">Open queue</option><option value="Approved">Checked in</option><option value="Scheduled">Waiting</option><option value="Completed">Completed</option><option value="all">All statuses</option></select></label>
        </div>

        {loading ? <p className="dashboard-empty-state">Loading the clinic queue...</p> : !visibleAppointments.length ? (
          <div className="staff-queue-empty"><span className="dashboard-icon-bubble"><DashboardIcon name="calendar" /></span><div><h3>No patients in this view</h3><p>Try another date or status filter. New bookings will appear here automatically.</p></div></div>
        ) : (
          <div className="staff-queue-list">
            {visibleAppointments.map((appointment) => (
              <article key={appointment._id} className="staff-queue-card">
                <div className="staff-queue-number"><span>Queue</span><strong>{appointment.queueNumber || "-"}</strong><small>{appointment.dailyQueueSize ? `of ${appointment.dailyQueueSize}` : "Walk-in"}</small></div>
                <div className="staff-queue-main">
                  <div className="dashboard-record-header"><div><h3>{appointment.patientName}</h3><p>{appointment.reason || "Consultation appointment"}</p></div><span className={`dashboard-badge staff-status-${appointment.status.toLowerCase()}`}>{statusLabel(appointment.status)}</span></div>
                  <div className="dashboard-record-meta"><span><DashboardIcon name="calendar" /> {formatDate(appointment.appointmentDate)}</span><span><DashboardIcon name="clock" /> Expected around {appointment.appointmentTime || "Not scheduled"}</span><span><DashboardIcon name="stetho" /> {appointment.doctorId?.name || "Assigned doctor"}</span><span><DashboardIcon name="hospital" /> {appointment.clinic?.name || "Clinic not attached"}</span></div>
                  <div className="staff-queue-patient-meta"><span>{appointment.patientPhone || "No phone"}</span><span>{appointment.patientAge || "-"} yrs</span><span>{appointment.patientGender || "-"}</span><span>{appointment.patientsAhead ? `${appointment.patientsAhead} ahead` : "Next in queue"}</span></div>
                  <div className="dashboard-record-actions"><button type="button" className="dashboard-primary-action" onClick={() => setManagingAppointment(appointment)}>Manage patient</button><QueueTicketPrintButton appointment={appointment} /><PrescriptionPrintButton appointment={appointment} compact /></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      {managingAppointment && <ManageAppointmentModal appointment={managingAppointment} labs={labs} onClose={() => setManagingAppointment(null)} onSaveAppointment={handleSaveAppointment} onReferPatient={handleReferPatient} />}
      {bookingOpen && <StaffBookingModal doctors={doctors} onClose={() => setBookingOpen(false)} onBook={handleBookAppointment} />}
    </DashboardLayout>
  );
}
