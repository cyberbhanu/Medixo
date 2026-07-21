import { useState } from "react";
import "../styles/modal.css";

const ManageAppointmentModal = ({ appointment, labs, onClose, onSaveAppointment, onReferPatient }) => {
  const [activeTab, setActiveTab] = useState("notes"); // 'notes' or 'refer'

  const [appointmentDraft, setAppointmentDraft] = useState({
    patientName: appointment.patientName || "",
    patientPhone: appointment.patientPhone || "",
    patientAge: appointment.patientAge || "",
    patientGender: appointment.patientGender || "Other",
    appointmentDate: appointment.appointmentDate || "",
    appointmentTime: appointment.appointmentTime || "",
    reason: appointment.reason || "",
    disease: appointment.disease || "",
    treatmentPlan: appointment.treatmentPlan || "",
    notes: appointment.notes || "",
    status: appointment.status || "Scheduled",
  });
  const [savingAppointmentUpdate, setSavingAppointmentUpdate] = useState(false);

  const [referForm, setReferForm] = useState({
    labId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });
  const [savingReferral, setSavingReferral] = useState(false);

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    setSavingAppointmentUpdate(true);
    await onSaveAppointment(appointment._id, appointmentDraft);
    setSavingAppointmentUpdate(false);
  };

  const handleReferral = async (e) => {
    e.preventDefault();
    setSavingReferral(true);
    const success = await onReferPatient(appointment, referForm);
    if (success) {
      setReferForm({ labId: "", appointmentDate: "", appointmentTime: "", reason: "" });
      setActiveTab("notes");
    }
    setSavingReferral(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2 className="modal-title">
            Manage: {appointment.patientName}
          </h2>
          <button onClick={onClose} className="modal-close-btn" type="button">x</button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Care Notes</button>
          <button className={`modal-tab-btn ${activeTab === 'refer' ? 'active' : ''}`} onClick={() => setActiveTab('refer')}>Refer to Lab</button>
        </div>

        {activeTab === 'notes' && (
          <form onSubmit={handleSaveNotes} className="modal-form">
            <div className="modal-form-grid">
              <label className="modal-form-group">
                <span className="modal-label">Patient Name</span>
                <input value={appointmentDraft.patientName} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, patientName: e.target.value })} className="modal-input" />
              </label>
              <label className="modal-form-group">
                <span className="modal-label">Phone</span>
                <input value={appointmentDraft.patientPhone} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, patientPhone: e.target.value })} className="modal-input" />
              </label>
              <label className="modal-form-group">
                <span className="modal-label">Age</span>
                <input type="number" value={appointmentDraft.patientAge} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, patientAge: e.target.value })} className="modal-input" />
              </label>
              <label className="modal-form-group">
                <span className="modal-label">Gender</span>
                <select value={appointmentDraft.patientGender} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, patientGender: e.target.value })} className="modal-input">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="modal-form-group">
                <span className="modal-label">Date</span>
                <input type="date" value={appointmentDraft.appointmentDate} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, appointmentDate: e.target.value })} className="modal-input" />
              </label>
              <label className="modal-form-group">
                <span className="modal-label">Time</span>
                <input type="time" value={appointmentDraft.appointmentTime} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, appointmentTime: e.target.value })} className="modal-input" />
              </label>
            </div>
            <label className="modal-form-group">
              <span className="modal-label">Primary Reason</span>
              <input value={appointmentDraft.reason} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, reason: e.target.value })} className="modal-input" />
            </label>
            <label className="modal-form-group">
              <span className="modal-label">Disease / Diagnosis</span>
              <input value={appointmentDraft.disease} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, disease: e.target.value })} className="modal-input" placeholder="e.g., Type 2 Diabetes" />
            </label>
            <label className="modal-form-group">
              <span className="modal-label">Treatment Plan</span>
              <textarea rows="3" value={appointmentDraft.treatmentPlan} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, treatmentPlan: e.target.value })} className="modal-input" placeholder="Medication, lifestyle changes, follow-up instructions..." />
            </label>
            <label className="modal-form-group">
              <span className="modal-label">Clinical Notes</span>
              <textarea rows="3" value={appointmentDraft.notes} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, notes: e.target.value })} className="modal-input" placeholder="Important findings, history, next steps..." />
            </label>
            <label className="modal-form-group">
              <span className="modal-label">Visit Status</span>
              <select value={appointmentDraft.status} onChange={(e) => setAppointmentDraft({ ...appointmentDraft, status: e.target.value })} className="modal-input">
                <option value="Scheduled">Scheduled</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
            <div className="modal-buttons">
              <button type="button" onClick={onClose} className="modal-cancel-btn">Close</button>
              <button type="submit" className="modal-submit-btn" disabled={savingAppointmentUpdate}>{savingAppointmentUpdate ? "Saving..." : "Save Patient Record"}</button>
            </div>
          </form>
        )}

        {activeTab === 'refer' && (
          <form onSubmit={handleReferral} className="modal-form">
            <div className="modal-form-group">
              <label className="modal-label">Select Lab Facility</label>
              <select value={referForm.labId} onChange={(e) => setReferForm({...referForm, labId: e.target.value})} className="modal-input" required>
                <option value="">Choose a lab...</option>
                {labs.map(lab => <option key={lab._id} value={lab._id}>{lab.name} - {lab.location}</option>)}
              </select>
            </div>
            <div className="modal-form-grid-2-col">
              <div className="modal-form-group">
                <label className="modal-label">Date</label>
                <input type="date" value={referForm.appointmentDate} onChange={(e) => setReferForm({...referForm, appointmentDate: e.target.value})} className="modal-input" required />
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Time</label>
                <input type="time" value={referForm.appointmentTime} onChange={(e) => setReferForm({...referForm, appointmentTime: e.target.value})} className="modal-input" required />
              </div>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Required Tests / Reason</label>
              <input type="text" placeholder="e.g., Complete Blood Count (CBC)" value={referForm.reason} onChange={(e) => setReferForm({...referForm, reason: e.target.value})} className="modal-input" required />
            </div>
            <div className="modal-buttons">
              <button type="button" onClick={onClose} className="modal-cancel-btn" disabled={savingReferral}>Cancel</button>
              <button type="submit" disabled={savingReferral} className="modal-submit-btn">
                {savingReferral ? "Referring..." : "Confirm Referral"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManageAppointmentModal;
