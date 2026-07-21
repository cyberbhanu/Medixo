import { useEffect, useState } from "react";
import { getAppointments, getDoctors, updateDoctorHospitalDetails, updateDoctorAvailability, getLabs, createAppointment, updateAppointment } from "../api";
import DashboardLayout, {
  DashboardIcon,
  DashboardSection,
} from "../components/DashboardLayout";
import ClinicDetailsCard from "../components/ClinicDetailsCard";
import EditClinicDetailsModal from "../components/EditClinicDetailsModal";
import ManageAppointmentModal from "../components/ManageAppointmentModal";
import "../styles/modal.css";
import { getStoredUser } from "../utils/auth";

export default function DoctorDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Doctor";
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [managingAppointment, setManagingAppointment] = useState(null);

  useEffect(() => {
    if (!user?.id && !user?.email) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [doctorProfiles, labData] = await Promise.all([
          getDoctors({
          userId: user.id,
          email: user.email,
          }),
          getLabs()
        ]);

        const activeDoctorProfile = doctorProfiles[0] || null;
        setDoctorProfile(activeDoctorProfile);
        setLabs(labData);

        if (!activeDoctorProfile?._id) {
          setAppointments([]);
          return;
        }

        const appointmentData = await getAppointments({
          doctorId: activeDoctorProfile._id,
        });

        setAppointments(appointmentData);
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Failed to load doctor dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.email, user?.id]);

  const handleSaveAppointment = async (appointmentId, draft) => {
    try {
      const updated = await updateAppointment(appointmentId, {
        ...draft,
        patientAge: Number(draft.patientAge),
      });

      setAppointments((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setManagingAppointment(updated); // Keep modal open with updated data
      alert("Patient record updated successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update patient details");
    }
  };

  const handleReferPatient = async (patientAppointment, referralDetails) => {
    try {
      await createAppointment({
        type: "lab",
        labId: referralDetails.labId,
        referredBy: doctorProfile._id,
        patientName: patientAppointment.patientName,
        patientEmail: patientAppointment.patientEmail,
        patientPhone: patientAppointment.patientPhone,
        patientAge: patientAppointment.patientAge,
        patientGender: patientAppointment.patientGender,
        appointmentDate: referralDetails.appointmentDate,
        appointmentTime: referralDetails.appointmentTime,
        reason: referralDetails.reason,
        notes: `Referred by Dr. ${doctorProfile.name} for: ${referralDetails.reason}`,
      });
      alert("Patient successfully referred to the lab!");
      return true; // Indicate success
    } catch (err) {
      alert(err.response?.data?.error || "Failed to refer to lab");
      return false; // Indicate failure
    }
  };

  const activePatients = new Set(appointments.map((appointment) => appointment.patientEmail)).size;
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "Completed"
  ).length;
  const weeklyEarnings = appointments
    .filter((appointment) => appointment.status !== "Cancelled")
    .reduce((total, appointment) => total + (appointment.doctorId?.fees || doctorProfile?.fees || 0), 0);
  const requests = appointments
    .filter((appointment) => appointment.status !== "Completed")
    .slice(0, 4)
    .map(
      (appointment) =>
        `Queue #${appointment.queueNumber || "-"}: ${appointment.patientName} (${appointment.patientPhone}) on ${appointment.appointmentDate} at ${appointment.appointmentTime}`
    );
  const clinicMetrics = [
    { label: "Specialization", value: doctorProfile?.specialization || "Pending" },
    { label: "Location", value: doctorProfile?.location || "Pending" },
    { label: "Experience", value: doctorProfile ? `${doctorProfile.experience} yrs` : "Pending" },
    { label: "Consultation fee", value: doctorProfile ? `Rs. ${doctorProfile.fees}` : "Pending" },
  ];
  const stats = [
    {
      icon: "calendar",
      value: String(appointments.length),
      label: "Your Appointments",
      note: doctorProfile ? "Only bookings assigned to your doctor profile are shown here" : "Complete doctor signup details to activate scheduling",
    },
    {
      icon: "users",
      value: String(activePatients),
      label: "Active Patients",
      note: "Unique patient emails assigned to you",
    },
    {
      icon: "star",
      value: String(completedAppointments),
      label: "Completed Visits",
      note: "Finished consultations tracked from appointment status",
    },
    {
      icon: "rupee",
      value: `Rs. ${weeklyEarnings}`,
      label: "Projected Earnings",
      note: "Calculated from your linked appointments",
    },
  ];

  return (
    <DashboardLayout
      role="Doctor Dashboard"
      title={`Good to see you, Dr. ${firstName}`}
      subtitle="Manage appointments, review patients faster, and keep your clinic day running on time with live data connected to your signup details."
      chips={["Smart schedule", "Patient insights", "Fast follow-ups"]}
      stats={stats}
      quickActions={[
        { icon: "plus", label: "Add Slot", variant: "primary" },
        { icon: "bell", label: "Send Reminder" },
        { icon: "chart", label: "View Analytics" },
      ]}
      aside={
        <>
          <DashboardSection title="Priority Queue">
            <div className="dashboard-mini-list">
              {requests.map((item) => (
                <div key={item} className="dashboard-mini-row">
                  <span className="dashboard-mini-dot urgent" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection title="Clinic Snapshot">
            <div className="dashboard-metric-list">
              {clinicMetrics.map((item) => (
                <div key={item.label} className="dashboard-metric-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </DashboardSection>
        </>
      }
    >
      {error ? <div className="dashboard-banner error">{error}</div> : null}

      <DashboardSection title="Hospital/Clinic Details">
        <ClinicDetailsCard 
          doctorProfile={doctorProfile}
          onEdit={() => setShowEditModal(true)}
        />
      </DashboardSection>

      <DashboardSection 
        title="Availability & Blocked Times" 
        action="Edit Schedule"
        onActionClick={() => setShowAvailabilityModal(true)}
      >
        <div className="dashboard-table">
          {doctorProfile?.availability?.length ? (
            doctorProfile.availability.map((daySchedule) => (
              <article key={daySchedule.day} className="dashboard-table-row">
                <div>
                  <h3>{daySchedule.day}</h3>
                </div>
                {daySchedule.isAvailable ? (
                  <span className="dashboard-time-pill">
                    <DashboardIcon name="clock" /> {daySchedule.startTime} - {daySchedule.endTime}
                  </span>
                ) : (
                  <span className="dashboard-inline-badge" style={{ backgroundColor: '#ffebee', color: '#c62828' }}>Blocked</span>
                )}
              </article>
            ))
          ) : (
            <p className="dashboard-empty-state">
              No availability schedule set. Click "Edit Schedule" to configure your working hours and blocked times.
            </p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Patient Care Queue" action="Professional view">
        <div className="dashboard-table">
          {loading ? (
            <p className="dashboard-empty-state">Loading appointments...</p>
          ) : doctorProfile ? (
            appointments.length ? (
              appointments.map((item) => (
                <article key={item._id} className="dashboard-table-row dashboard-patient-row">
                  <div className="dashboard-patient-row-header">
                    <div>
                      <h3>{item.patientName}</h3>
                      <p>{item.reason}</p>
                      <p className="dashboard-muted-note">
                        {item.disease ? `Condition: ${item.disease}` : "No diagnosis recorded yet"}
                      </p>
                    </div>
                    <div className="dashboard-action-row">
                      <span className="dashboard-time-pill">
                        <DashboardIcon name="clock" /> {item.appointmentTime}
                      </span>
                      <span className="dashboard-inline-badge">{item.status}</span>
                    </div>
                  </div>
                  <div className="dashboard-action-row">
                    <button type="button" onClick={() => setManagingAppointment(item)} className="dashboard-primary-action dashboard-compact-action">
                      Manage Patient
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="dashboard-empty-state">
                No appointments are assigned to your doctor profile yet. Bookings linked to your profile will appear here automatically.
              </p>
            )
          ) : (
            <p className="dashboard-empty-state">
              No doctor profile is linked to this account yet. Sign up as a doctor with all profile fields filled to activate this dashboard.
            </p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Follow-up Performance" action="Export">
        <div className="dashboard-performance-grid">
          <article className="dashboard-performance-card">
            <span className="dashboard-icon-bubble">
              <DashboardIcon name="lightning" />
            </span>
            <h3>Linked Doctor Profile</h3>
            <p>
              {doctorProfile
                ? `${doctorProfile.name} is connected to this login and ready to receive appointments automatically.`
                : "This account does not yet have a complete doctor profile in the system."}
            </p>
          </article>

          <article className="dashboard-performance-card">
            <span className="dashboard-icon-bubble">
              <DashboardIcon name="message" />
            </span>
            <h3>Patient Communication</h3>
            <p>
              {activePatients
                ? `${activePatients} patients are currently mapped to your appointment list through their booking email.`
                : "Patient activity will appear here once appointments are created for your doctor profile."}
            </p>
          </article>

          <article className="dashboard-performance-card">
            <span className="dashboard-icon-bubble">
              <DashboardIcon name="chart" />
            </span>
            <h3>Case Efficiency</h3>
            <p>
              {appointments.length
                ? `${appointments.length} appointments are now being tracked directly from the backend for this doctor account.`
                : "Your dashboard is ready and will fill itself as soon as appointments are booked."}
            </p>
          </article>
        </div>
      </DashboardSection>

      {showEditModal && (
        <EditClinicDetailsModal
          doctorProfile={doctorProfile}
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedDetails) => {
            await updateDoctorHospitalDetails(
              doctorProfile._id,
              updatedDetails,
              localStorage.getItem("token")
            );
            // Reload doctor profile
            const doctorProfiles = await getDoctors({
              userId: user.id,
              email: user.email,
            });
            setDoctorProfile(doctorProfiles[0]);
            setShowEditModal(false);
          }}
        />
      )}

      {showAvailabilityModal && (
        <EditAvailabilityModal
          doctorProfile={doctorProfile}
          onClose={() => setShowAvailabilityModal(false)}
          onSave={async (updatedAvailability) => {
            await updateDoctorAvailability(doctorProfile._id, updatedAvailability);
            const doctorProfiles = await getDoctors({ userId: user.id, email: user.email });
            setDoctorProfile(doctorProfiles[0]);
            setShowAvailabilityModal(false);
          }}
        />
      )}

      {managingAppointment && (
        <ManageAppointmentModal
          appointment={managingAppointment}
          labs={labs}
          onClose={() => setManagingAppointment(null)}
          onSaveAppointment={handleSaveAppointment}
          onReferPatient={handleReferPatient}
        />
      )}
    </DashboardLayout>
  );
}

function EditAvailabilityModal({ doctorProfile, onClose, onSave }) {
  const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [availability, setAvailability] = useState(
    doctorProfile?.availability?.length
      ? doctorProfile.availability
      : DEFAULT_DAYS.map(day => ({ day, startTime: "09:00", endTime: "17:00", isAvailable: true }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleDay = (index) => {
    const newAvail = [...availability];
    newAvail[index].isAvailable = !newAvail[index].isAvailable;
    setAvailability(newAvail);
  };

  const handleTimeChange = (index, field, value) => {
    const newAvail = [...availability];
    newAvail[index][field] = value;
    setAvailability(newAvail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave(availability);
    } catch (err) {
      setError(err.message || "Failed to save availability");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Set Availability</h2>
          <button onClick={onClose} className="modal-close-btn" type="button">x</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {availability.map((daySchedule, idx) => (
              <div key={daySchedule.day} className="availability-row">
                <div className="availability-day">{daySchedule.day}</div>
                <label className="availability-toggle">
                  <input type="checkbox" checked={daySchedule.isAvailable} onChange={() => handleToggleDay(idx)} />
                  Available
                </label>
                {daySchedule.isAvailable && (
                  <div className="availability-times">
                    <input type="time" value={daySchedule.startTime} onChange={(e) => handleTimeChange(idx, "startTime", e.target.value)} className="modal-input availability-time-input" required />
                    <span>to</span>
                    <input type="time" value={daySchedule.endTime} onChange={(e) => handleTimeChange(idx, "endTime", e.target.value)} className="modal-input availability-time-input" required />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="modal-cancel-btn" disabled={loading}>Cancel</button>
            <button type="submit" className="modal-submit-btn" disabled={loading}>{loading ? "Saving..." : "Save Schedule"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
