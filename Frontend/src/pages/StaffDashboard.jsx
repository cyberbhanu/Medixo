import { useEffect, useMemo, useState } from "react";
import { getAppointments, updateAppointment } from "../api";
import DashboardLayout, { DashboardIcon, DashboardSection } from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";
import ManageAppointmentModal from "../components/ManageAppointmentModal";

const ACTIVE_STATUSES = ["Scheduled", "Approved", "Rescheduled"];

export default function StaffDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Staff";
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [managingAppointment, setManagingAppointment] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const appointmentData = await getAppointments();
      setAppointments(appointmentData);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSaveAppointment = async (appointmentId, draft) => {
    try {
      const updated = await updateAppointment(appointmentId, draft);
      setAppointments((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setManagingAppointment(updated);
      setSuccess("Appointment updated successfully.");
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to save appointment");
      setSuccess("");
      return false;
    }
  };

  const stats = [
    {
      icon: "calendar",
      value: String(appointments.filter((appointment) => ACTIVE_STATUSES.includes(appointment.status)).length),
      label: "Open Appointments",
      note: "Appointments staff can manage now",
    },
    {
      icon: "users",
      value: String(new Set(appointments.map((appointment) => appointment.patientEmail)).size),
      label: "Patients Served",
      note: "Unique patient contacts in appointments",
    },
    {
      icon: "clock",
      value: String(appointments.length),
      label: "Total Appointments",
      note: "Current schedule available to staff",
    },
  ];

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => ACTIVE_STATUSES.includes(appointment.status)),
    [appointments]
  );

  return (
    <DashboardLayout
      role="Staff Dashboard"
      title={`Welcome back, ${firstName}`}
      subtitle="Handle appointment coordination, update patient notes, and create appointment PDFs for patients."
      chips={["Appointments", "Patient Support", "PDF Reports"]}
      stats={stats}
      quickActions={[
        {
          label: "Refresh Appointments",
          icon: "refresh",
          variant: "secondary",
          onClick: loadDashboardData,
        },
      ]}
      aside={
        <div className="dashboard-card">
          <h3>Staff Guidance</h3>
          <p>Use the appointment manager to update patient details, appointment status, and clinical notes. When a patient arrives, download the PDF record for them.</p>
        </div>
      }
    >
      <DashboardSection title="Today's Appointments" action="Refresh" onActionClick={loadDashboardData}>
        {loading ? (
          <p className="dashboard-empty-state">Loading appointments...</p>
        ) : error ? (
          <p className="dashboard-empty-state">{error}</p>
        ) : !appointments.length ? (
          <p className="dashboard-empty-state">No appointments found yet.</p>
        ) : (
          <div className="dashboard-list">
            {upcomingAppointments.map((appointment) => (
              <article key={appointment._id} className="dashboard-record-card">
                <div className="dashboard-record-header">
                  <div>
                    <h3>{appointment.patientName}</h3>
                    <p>{appointment.patientEmail}</p>
                  </div>
                  <span className="dashboard-badge">{appointment.status}</span>
                </div>
                <div className="dashboard-record-meta">
                  <span>{appointment.appointmentDate} • {appointment.appointmentTime}</span>
                  <span>{appointment.doctorId?.name || appointment.labId?.name || "Assigned"}</span>
                </div>
                <div className="dashboard-record-actions">
                  <button type="button" className="dashboard-primary-action" onClick={() => setManagingAppointment(appointment)}>
                    Manage
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      {managingAppointment && (
        <ManageAppointmentModal
          appointment={managingAppointment}
          labs={[]}
          onClose={() => setManagingAppointment(null)}
          onSaveAppointment={handleSaveAppointment}
          showReferTab={false}
        />
      )}

      {success && <div className="dashboard-banner success">{success}</div>}
    </DashboardLayout>
  );
}
