import { useEffect, useState } from "react";
import { createAppointment, getAppointments, getDoctors, getLabs, updateAppointment } from "../api";
import DashboardLayout, {
  DashboardIcon,
  DashboardSection,
} from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";

const activity = [
  "Blood test report uploaded and reviewed",
  "Insurance details updated successfully",
  "Prescription reminder set for 8:00 PM",
  "Annual health package renewed",
];

const careChecklist = [
  "Take Vitamin D after breakfast",
  "Upload ECG report before tomorrow",
  "Complete pre-visit questionnaire",
  "Confirm fasting instructions for lab work",
];

const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;
const UPCOMING_STATUSES = ["Scheduled", "Approved", "Rescheduled"];
const todayDate = () => new Date().toISOString().split("T")[0];

const isFutureAppointment = (date, time) => {
  if (!date || !time) {
    return false;
  }

  return new Date(`${date}T${time}:00`).getTime() > Date.now();
};

const validateAppointmentForm = (form) => {
  const errors = {};

  if (form.type === "doctor" && !form.doctorId) {
    errors.doctorId = "Please choose a doctor.";
  }

  if (form.type === "lab" && !form.labId) {
    errors.labId = "Please choose a lab.";
  }

  if (!PHONE_REGEX.test(form.patientPhone.trim())) {
    errors.patientPhone = "Enter a valid phone number.";
  }

  const age = Number(form.patientAge);
  if (Number.isNaN(age) || age < 1 || age > 120) {
    errors.patientAge = "Age must be between 1 and 120.";
  }

  if (!form.appointmentDate) {
    errors.appointmentDate = "Select an appointment date.";
  } else if (form.appointmentDate < todayDate()) {
    errors.appointmentDate = "Appointment date cannot be in the past.";
  }

  if (!form.appointmentTime) {
    errors.appointmentTime = "Select an appointment time.";
  } else if (form.appointmentDate && !isFutureAppointment(form.appointmentDate, form.appointmentTime)) {
    errors.appointmentTime = "Choose a future appointment time.";
  }

  if (!form.reason.trim()) {
    errors.reason = "Tell us the reason for the appointment.";
  }

  return errors;
};

export default function PatientDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Patient";
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [labs, setLabs] = useState([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [appointmentFormErrors, setAppointmentFormErrors] = useState({});
  const [appointmentActionLoadingId, setAppointmentActionLoadingId] = useState("");
  const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState("");
  const [rescheduleDraft, setRescheduleDraft] = useState({
    appointmentDate: "",
    appointmentTime: "",
  });
  const [rescheduleErrors, setRescheduleErrors] = useState({});
  const [appointmentForm, setAppointmentForm] = useState({
    type: "doctor",
    doctorId: "",
    labId: "",
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
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [appointmentData, doctorData, labData] = await Promise.all([
          getAppointments({ patientEmail: user.email }),
          getDoctors(),
          getLabs()
        ]);

        setAppointments(appointmentData);
        setDoctors(doctorData);
        setLabs(labData);
        setRecommendedDoctors(doctorData.slice(0, 3));
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Failed to load patient dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.email]);

  useEffect(() => {
    setAppointmentForm((currentForm) => ({
      ...currentForm,
      patientName: user?.name || "",
      patientEmail: user?.email || "",
    }));
  }, [user?.email, user?.name]);

  useEffect(() => {
    const preselectedDoctorId = sessionStorage.getItem("selectedDoctorId");

    if (preselectedDoctorId) {
      setAppointmentForm((currentForm) => ({
        ...currentForm,
        type: "doctor",
        doctorId: preselectedDoctorId,
      }));
      sessionStorage.removeItem("selectedDoctorId");
    }
  }, []);

  const loadPatientData = async () => {
    const [appointmentData, doctorData, labData] = await Promise.all([
      getAppointments({ patientEmail: user.email }),
      getDoctors(),
      getLabs()
    ]);

    setAppointments(appointmentData);
    setDoctors(doctorData);
    setLabs(labData);
    setRecommendedDoctors(doctorData.slice(0, 3));
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const validationErrors = validateAppointmentForm(appointmentForm);

    if (Object.keys(validationErrors).length) {
      setAppointmentFormErrors(validationErrors);
      return;
    }

    setSavingAppointment(true);

    try {
      await createAppointment(appointmentForm);
      setSuccess("Appointment booked successfully");
      setAppointmentForm({
        type: "doctor",
        doctorId: "",
        labId: "",
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
      setAppointmentFormErrors({});
      await loadPatientData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to book appointment");
    } finally {
      setSavingAppointment(false);
    }
  };

  const startFollowUpBooking = (doctor) => {
    setAppointmentForm((currentForm) => ({
      ...currentForm,
      doctorId: doctor._id,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startRescheduleAppointment = (appointment) => {
    setReschedulingAppointmentId(appointment._id);
    setRescheduleDraft({
      appointmentDate: appointment.appointmentDate || "",
      appointmentTime: appointment.appointmentTime || "",
    });
    setRescheduleErrors({});
    setError("");
    setSuccess("");
  };

  const cancelAppointment = async (appointment) => {
    if (!window.confirm("Cancel this appointment?")) {
      return;
    }

    setAppointmentActionLoadingId(appointment._id);
    setError("");
    setSuccess("");

    try {
      await updateAppointment(appointment._id, { status: "Cancelled" });
      setSuccess("Appointment cancelled successfully");
      await loadPatientData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to cancel appointment");
    } finally {
      setAppointmentActionLoadingId("");
    }
  };

  const submitRescheduleAppointment = async (event, appointment) => {
    event.preventDefault();
    const validationErrors = {};

    if (!rescheduleDraft.appointmentDate) {
      validationErrors.appointmentDate = "Select a new date.";
    } else if (rescheduleDraft.appointmentDate < todayDate()) {
      validationErrors.appointmentDate = "Date cannot be in the past.";
    }

    if (!rescheduleDraft.appointmentTime) {
      validationErrors.appointmentTime = "Select a new time.";
    } else if (!isFutureAppointment(rescheduleDraft.appointmentDate, rescheduleDraft.appointmentTime)) {
      validationErrors.appointmentTime = "Choose a future time.";
    }

    if (Object.keys(validationErrors).length) {
      setRescheduleErrors(validationErrors);
      return;
    }

    setAppointmentActionLoadingId(appointment._id);
    setError("");
    setSuccess("");

    try {
      await updateAppointment(appointment._id, {
        appointmentDate: rescheduleDraft.appointmentDate,
        appointmentTime: rescheduleDraft.appointmentTime,
        status: "Rescheduled",
      });
      setSuccess("Appointment rescheduled successfully");
      setReschedulingAppointmentId("");
      setRescheduleErrors({});
      await loadPatientData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to reschedule appointment");
    } finally {
      setAppointmentActionLoadingId("");
    }
  };

  const upcomingAppointments = appointments.filter(
    (appointment) => UPCOMING_STATUSES.includes(appointment.status)
  );
  const nextAppointment = upcomingAppointments[0];
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "Completed"
  ).length;
  const stats = [
    {
      icon: "calendar",
      value: String(upcomingAppointments.length),
      label: "Upcoming Appointments",
      note: nextAppointment
        ? `Queue #${nextAppointment.queueNumber || "-"} on ${nextAppointment.appointmentDate} at ${nextAppointment.appointmentTime}`
        : "No appointment is booked yet",
    },
    {
      icon: "file",
      value: String(appointments.length),
      label: "Total Bookings",
      note: "All appointments linked to your signup email",
    },
    {
      icon: "shield",
      value: String(completedAppointments),
      label: "Completed Visits",
      note: "Finished consultations tracked automatically",
    },
    {
      icon: "pulse",
      value: String(doctors.length),
      label: "Available Doctors",
      note: "Doctors currently visible in the Medixo system",
    },
  ];

  return (
    <DashboardLayout
      role="Patient Dashboard"
      title={`Welcome back, ${firstName}`}
      subtitle="Track appointments, reports, reminders, and your ongoing care journey from one clean workspace."
      chips={["Secure records", "Live doctor updates", "Medication reminders"]}
      stats={stats}
      quickActions={[
        {
          icon: "plus",
          label: "Book Appointment",
          variant: "primary",
          onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        },
        { icon: "file", label: "Upload Report" },
        { icon: "message", label: "Message Doctor" },
      ]}
      aside={
        <>
          <DashboardSection title="Care Checklist">
            <div className="dashboard-checklist">
              {careChecklist.map((item) => (
                <div key={item} className="dashboard-check-item">
                  <span className="dashboard-tick">
                    <DashboardIcon name="check" />
                  </span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection title="Recent Activity">
            <div className="dashboard-mini-list">
              {activity.map((item) => (
                <div key={item} className="dashboard-mini-row">
                  <span className="dashboard-mini-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </DashboardSection>
        </>
      }
    >
      {error ? <div className="dashboard-banner error">{error}</div> : null}
      {success ? <div className="dashboard-banner success">{success}</div> : null}

      <DashboardSection title="Patient Appointment Form" action="Book for yourself">
        <form className="dashboard-form-card" onSubmit={handleAppointmentSubmit}>
          <div className="dashboard-form-grid">
            <label className="dashboard-input-group full-width">
              <span>Booking Type</span>
              <select
                value={appointmentForm.type}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, type: event.target.value, doctorId: "", labId: "" })
                }
              >
                <option value="doctor">Doctor Consultation</option>
                <option value="lab">Lab Test</option>
              </select>
            </label>

            {appointmentForm.type === "doctor" ? (
            <label className="dashboard-input-group full-width">
              <span>Select doctor</span>
              <select
                value={appointmentForm.doctorId}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, doctorId: event.target.value })
                }
                aria-invalid={Boolean(appointmentFormErrors.doctorId)}
                required
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              {appointmentFormErrors.doctorId ? <small className="dashboard-field-error">{appointmentFormErrors.doctorId}</small> : null}
            </label>
            ) : (
            <label className="dashboard-input-group full-width">
              <span>Select Lab</span>
              <select
                value={appointmentForm.labId}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, labId: event.target.value })
                }
                aria-invalid={Boolean(appointmentFormErrors.labId)}
                required
              >
                <option value="">Choose a Lab</option>
                {labs.map((lab) => (
                  <option key={lab._id} value={lab._id}>{lab.name} - {lab.location}</option>
                ))}
              </select>
              {appointmentFormErrors.labId ? <small className="dashboard-field-error">{appointmentFormErrors.labId}</small> : null}
            </label>
            )}

            <label className="dashboard-input-group">
              <span>Name</span>
              <input
                type="text"
                value={appointmentForm.patientName}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, patientName: event.target.value })
                }
                readOnly
                required
              />
            </label>

            <label className="dashboard-input-group">
              <span>Email</span>
              <input
                type="email"
                value={appointmentForm.patientEmail}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, patientEmail: event.target.value })
                }
                readOnly
                required
              />
            </label>

            <label className="dashboard-input-group">
              <span>Phone</span>
              <input
                type="tel"
                value={appointmentForm.patientPhone}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, patientPhone: event.target.value })
                }
                placeholder="9876543210"
                aria-invalid={Boolean(appointmentFormErrors.patientPhone)}
                required
              />
              {appointmentFormErrors.patientPhone ? <small className="dashboard-field-error">{appointmentFormErrors.patientPhone}</small> : null}
            </label>

            <label className="dashboard-input-group">
              <span>Age</span>
              <input
                type="number"
                min="1"
                value={appointmentForm.patientAge}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, patientAge: event.target.value })
                }
                placeholder="28"
                aria-invalid={Boolean(appointmentFormErrors.patientAge)}
                required
              />
              {appointmentFormErrors.patientAge ? <small className="dashboard-field-error">{appointmentFormErrors.patientAge}</small> : null}
            </label>

            <label className="dashboard-input-group">
              <span>Gender</span>
              <select
                value={appointmentForm.patientGender}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, patientGender: event.target.value })
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="dashboard-input-group">
              <span>Appointment date</span>
              <input
                type="date"
                min={todayDate()}
                value={appointmentForm.appointmentDate}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, appointmentDate: event.target.value })
                }
                aria-invalid={Boolean(appointmentFormErrors.appointmentDate)}
                required
              />
              {appointmentFormErrors.appointmentDate ? <small className="dashboard-field-error">{appointmentFormErrors.appointmentDate}</small> : null}
            </label>

            <label className="dashboard-input-group">
              <span>Appointment time</span>
              <input
                type="time"
                value={appointmentForm.appointmentTime}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, appointmentTime: event.target.value })
                }
                aria-invalid={Boolean(appointmentFormErrors.appointmentTime)}
                required
              />
              {appointmentFormErrors.appointmentTime ? <small className="dashboard-field-error">{appointmentFormErrors.appointmentTime}</small> : null}
            </label>

            <label className="dashboard-input-group full-width">
              <span>Reason for appointment</span>
              <input
                type="text"
                value={appointmentForm.reason}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, reason: event.target.value })
                }
                placeholder="Fever, skin consultation, chest pain, routine review..."
                aria-invalid={Boolean(appointmentFormErrors.reason)}
                required
              />
              {appointmentFormErrors.reason ? <small className="dashboard-field-error">{appointmentFormErrors.reason}</small> : null}
            </label>

            <label className="dashboard-input-group full-width">
              <span>Other details</span>
              <textarea
                rows="4"
                value={appointmentForm.notes}
                onChange={(event) =>
                  setAppointmentForm({ ...appointmentForm, notes: event.target.value })
                }
                placeholder="Add symptoms, previous history, medicines, or anything the doctor should know"
              />
            </label>
          </div>

          <div className="dashboard-form-actions">
            <button
              type="submit"
              className="dashboard-primary-action"
              disabled={savingAppointment || (appointmentForm.type === "doctor" ? !doctors.length : !labs.length)}
            >
              {savingAppointment ? "Booking..." : "Submit Appointment"}
            </button>
          </div>
        </form>
      </DashboardSection>

      <DashboardSection title="Upcoming Appointments" action="View Calendar">
        <div className="dashboard-card-list">
          {loading ? (
            <p className="dashboard-empty-state">Loading appointments...</p>
          ) : upcomingAppointments.length ? (
            upcomingAppointments.map((item) => (
              <article
                key={item._id}
                className="dashboard-appointment-card"
              >
                <div>
                  <span className="dashboard-inline-badge">{item.status}</span>
                  <h3>{item.type === 'lab' ? (item.labId?.name || "Assigned Lab") : (item.doctorId?.name || "Assigned Doctor")}</h3>
                  <p>{item.type === 'lab' ? "Lab Test" : (item.doctorId?.specialization || "Doctor profile pending")}</p>
                </div>
                <div className="dashboard-detail-stack">
                  <span>
                    <DashboardIcon name="users" /> Queue #{item.queueNumber || "-"} of {item.dailyQueueSize || 0}
                  </span>
                  <span>
                    <DashboardIcon name="calendar" /> {item.appointmentDate}
                  </span>
                  <span>
                    <DashboardIcon name="clock" /> {item.appointmentTime}
                  </span>
                  <span>
                    <DashboardIcon name="message" /> {item.patientPhone}
                  </span>
                </div>
                <button type="button">
                  {item.patientsAhead !== null ? `${item.patientsAhead} ahead` : "Open Details"}
                </button>
                {["Scheduled", "Approved", "Rescheduled"].includes(item.status) ? (
                  <div className="dashboard-appointment-actions">
                    {reschedulingAppointmentId === item._id ? (
                      <form className="dashboard-reschedule-form" onSubmit={(event) => submitRescheduleAppointment(event, item)}>
                        <label className="dashboard-input-group">
                          <span>New date</span>
                          <input
                            type="date"
                            min={todayDate()}
                            value={rescheduleDraft.appointmentDate}
                            onChange={(event) => setRescheduleDraft({ ...rescheduleDraft, appointmentDate: event.target.value })}
                            aria-invalid={Boolean(rescheduleErrors.appointmentDate)}
                            required
                          />
                          {rescheduleErrors.appointmentDate ? <small className="dashboard-field-error">{rescheduleErrors.appointmentDate}</small> : null}
                        </label>
                        <label className="dashboard-input-group">
                          <span>New time</span>
                          <input
                            type="time"
                            value={rescheduleDraft.appointmentTime}
                            onChange={(event) => setRescheduleDraft({ ...rescheduleDraft, appointmentTime: event.target.value })}
                            aria-invalid={Boolean(rescheduleErrors.appointmentTime)}
                            required
                          />
                          {rescheduleErrors.appointmentTime ? <small className="dashboard-field-error">{rescheduleErrors.appointmentTime}</small> : null}
                        </label>
                        <div className="dashboard-form-actions">
                          <button
                            type="submit"
                            className="dashboard-primary-action"
                            disabled={appointmentActionLoadingId === item._id}
                          >
                            {appointmentActionLoadingId === item._id ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="dashboard-secondary-action"
                            onClick={() => setReschedulingAppointmentId("")}
                            disabled={appointmentActionLoadingId === item._id}
                          >
                            Close
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="dashboard-secondary-action"
                          onClick={() => startRescheduleAppointment(item)}
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          className="dashboard-secondary-action danger"
                          onClick={() => cancelAppointment(item)}
                          disabled={appointmentActionLoadingId === item._id}
                        >
                          {appointmentActionLoadingId === item._id ? "Cancelling..." : "Cancel"}
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className="dashboard-empty-state">
              No appointments found for {user?.email}. When an appointment is booked with this email, it will appear here automatically.
            </p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Recommended Doctors" action="See More">
        <div className="dashboard-doctor-grid">
          {loading ? (
            <p className="dashboard-empty-state">Loading doctors...</p>
          ) : recommendedDoctors.length ? (
            recommendedDoctors.map((doctor) => (
              <article key={doctor._id} className="dashboard-recommend-card">
                <div className="dashboard-doctor-avatar" aria-hidden="true">
                  {doctor.name?.charAt(0) || "D"}
                </div>
                <div>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialization} - {doctor.location}</p>
                  <strong>Rs. {doctor.fees}</strong>
                </div>
                <button type="button" onClick={() => startFollowUpBooking(doctor)}>
                  Book Follow-up
                </button>
              </article>
            ))
          ) : (
            <p className="dashboard-empty-state">No doctors are available yet. Doctor signups will appear here automatically.</p>
          )}
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
