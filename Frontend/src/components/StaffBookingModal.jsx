import { useState } from "react";
import "../styles/modal.css";

const EMPTY_FORM = {
  doctorId: "", patientName: "", patientEmail: "", patientPhone: "", patientAge: "",
  patientGender: "Other", appointmentDate: "", appointmentTime: "", reason: "", notes: "",
};

const today = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function StaffBookingModal({ doctors, onClose, onBook }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (await onBook({ ...form, type: "doctor" })) onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to book the appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2 className="modal-title">Book appointment for patient</h2>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close">x</button>
        </div>
        {error ? <div className="dashboard-banner error">{error}</div> : null}
        <form onSubmit={submit} className="modal-form">
          <div className="modal-form-grid">
            <label className="modal-form-group"><span className="modal-label">Doctor</span><select className="modal-input" value={form.doctorId} onChange={(event) => update("doctorId", event.target.value)} required><option value="">Choose an assigned doctor</option>{doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name} - {doctor.specialization}</option>)}</select></label>
            <label className="modal-form-group"><span className="modal-label">Patient name</span><input className="modal-input" value={form.patientName} onChange={(event) => update("patientName", event.target.value)} required /></label>
            <label className="modal-form-group"><span className="modal-label">Patient email</span><input type="email" className="modal-input" value={form.patientEmail} onChange={(event) => update("patientEmail", event.target.value)} required /></label>
            <label className="modal-form-group"><span className="modal-label">Phone</span><input className="modal-input" value={form.patientPhone} onChange={(event) => update("patientPhone", event.target.value)} required /></label>
            <label className="modal-form-group"><span className="modal-label">Age</span><input type="number" min="1" max="120" className="modal-input" value={form.patientAge} onChange={(event) => update("patientAge", event.target.value)} required /></label>
            <label className="modal-form-group"><span className="modal-label">Gender</span><select className="modal-input" value={form.patientGender} onChange={(event) => update("patientGender", event.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></label>
            <label className="modal-form-group"><span className="modal-label">Preferred date</span><input type="date" min={today()} className="modal-input" value={form.appointmentDate} onChange={(event) => update("appointmentDate", event.target.value)} required /></label>
            <label className="modal-form-group"><span className="modal-label">Preferred time (optional)</span><input type="time" className="modal-input" value={form.appointmentTime} onChange={(event) => update("appointmentTime", event.target.value)} /><small className="dashboard-field-hint">Leave blank to use the next queue time from the doctor schedule.</small></label>
          </div>
          <label className="modal-form-group"><span className="modal-label">Reason</span><input className="modal-input" value={form.reason} onChange={(event) => update("reason", event.target.value)} required /></label>
          <label className="modal-form-group"><span className="modal-label">Notes</span><textarea rows="3" className="modal-input" value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          <div className="modal-buttons"><button type="button" onClick={onClose} className="modal-cancel-btn">Cancel</button><button type="submit" className="modal-submit-btn" disabled={saving || !doctors.length}>{saving ? "Booking..." : "Confirm appointment"}</button></div>
        </form>
      </div>
    </div>
  );
}
