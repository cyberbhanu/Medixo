import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHospitalAccount } from "../api";
import DashboardLayout from "../components/DashboardLayout";
import "../styles/dashboard.css";

export default function HospitalDashboard() {
  const [hospital, setHospital] = useState(null);
  const [error, setError] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  useEffect(() => {
    getHospitalAccount().then(setHospital).catch((requestError) => {
      setError(requestError.response?.data?.error || "Unable to load hospital dashboard.");
    });
  }, []);

  const doctors = hospital?.doctors || [];
  const appointments = hospital?.appointments || [];
  const filteredAppointments = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return appointments;
    return appointments.filter((appointment) => [
      appointment.patientName,
      appointment.patientEmail,
      appointment.patientPhone,
      appointment.reason,
      appointment.doctorId?.name,
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [appointments, patientSearch]);

  return (
    <DashboardLayout
      role="Hospital Dashboard"
      title={hospital?.name || "Hospital dashboard"}
      subtitle="Review your hospital profile, assigned doctors, and appointment activity."
      chips={["Hospital profile", "Assigned doctors", "Appointment activity"]}
      stats={[
        { label: "Assigned Doctors", value: doctors.length, icon: "doctor" },
        { label: "Appointments", value: appointments.length, icon: "calendar" },
        { label: "City", value: hospital?.city || "-", icon: "pulse" },
      ]}
      quickActions={[]}
    >
      {error ? <p className="dashboard-alert error">{error}</p> : null}
      <section className="dashboard-section">
        <div className="dashboard-section-heading"><div><span>Hospital care team</span><h2>Assigned doctors</h2></div></div>
        {doctors.length ? (
          <div className="dashboard-admin-list">
            {doctors.map((doctor) => (
              <article className="dashboard-admin-record" key={doctor._id}>
                <div className="dashboard-record-header"><div><h3>Dr. {doctor.name}</h3><p>{doctor.specialization || "Medical practitioner"}</p></div><span className="dashboard-inline-badge">Active</span></div>
                <div className="dashboard-record-meta"><span>{doctor.location || hospital?.city}</span><span>{doctor.experience || 0}+ years</span><span>Rs. {doctor.fees || 0}</span></div>
                <div className="dashboard-action-row"><Link className="dashboard-secondary-action" to={`/doctors/${doctor._id}`}>View profile</Link></div>
              </article>
            ))}
          </div>
        ) : <p className="dashboard-empty-state">No doctors have been assigned to this hospital yet. Ask the administrator to add a doctor here.</p>}
      </section>
      <section className="dashboard-section" id="hospital-patient-search">
        <div className="dashboard-section-heading"><div><span>Patient records</span><h2>Search appointments</h2></div></div>
        <label className="dashboard-input-group full-width dashboard-search-field">
          <span>Search patient</span>
          <input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Name, phone, email, doctor, or reason" />
        </label>
        {filteredAppointments.length ? (
          <div className="dashboard-admin-list">
            {filteredAppointments.map((appointment) => (
              <article className="dashboard-admin-record" key={appointment._id}>
                <div className="dashboard-record-header"><div><h3>{appointment.patientName || "Patient"}</h3><p>{appointment.doctorId?.name ? `Dr. ${appointment.doctorId.name}` : "Hospital appointment"}</p></div><span className="dashboard-inline-badge">{appointment.status}</span></div>
                <div className="dashboard-record-meta"><span>{appointment.patientPhone || "No phone"}</span><span>{appointment.appointmentDate} · {appointment.appointmentTime}</span><span>{appointment.reason || "Consultation"}</span></div>
                {appointment.reportUrl ? <a href={appointment.reportUrl} target="_blank" rel="noreferrer" className="dashboard-secondary-action">View laboratory report</a> : null}
              </article>
            ))}
          </div>
        ) : <p className="dashboard-empty-state">No hospital appointments match this patient search.</p>}
      </section>
    </DashboardLayout>
  );
}
