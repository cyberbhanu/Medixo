import DashboardLayout, {
  DashboardIcon,
  DashboardSection,
} from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";

const stats = [
  { icon: "calendar", value: "18", label: "Today's Appointments", note: "5 patients already checked in" },
  { icon: "users", value: "246", label: "Active Patients", note: "12 new patient records this month" },
  { icon: "star", value: "4.9", label: "Patient Rating", note: "Based on 1,240 reviews" },
  { icon: "rupee", value: "Rs. 38k", label: "Weekly Earnings", note: "12% higher than last week" },
];

const schedule = [
  { patient: "Ananya Mehta", reason: "Chest pain review", time: "09:00 AM", mode: "In-clinic" },
  { patient: "Rakesh Kumar", reason: "Blood pressure follow-up", time: "10:30 AM", mode: "Video" },
  { patient: "Sana Khan", reason: "Prescription renewal", time: "12:15 PM", mode: "Video" },
  { patient: "Kabir Shah", reason: "Post-surgery check-in", time: "03:00 PM", mode: "In-clinic" },
];

const requests = [
  "3 lab reports need review before evening rounds",
  "2 prescription renewals are waiting for approval",
  "1 patient has requested an urgent callback",
  "4 empty slots are available for tomorrow morning",
];

const clinicMetrics = [
  { label: "Average consultation", value: "22 min" },
  { label: "No-show rate", value: "3%" },
  { label: "Pending reports", value: "7" },
  { label: "Completed follow-ups", value: "31" },
];

export default function DoctorDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Doctor";

  return (
    <DashboardLayout
      role="Doctor Dashboard"
      title={`Good to see you, Dr. ${firstName}`}
      subtitle="Manage appointments, review patients faster, and keep your clinic day running on time with one focused dashboard."
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
      <DashboardSection title="Today's Schedule" action="Open Full Schedule">
        <div className="dashboard-table">
          {schedule.map((item) => (
            <article key={`${item.patient}-${item.time}`} className="dashboard-table-row">
              <div>
                <h3>{item.patient}</h3>
                <p>{item.reason}</p>
              </div>
              <span className="dashboard-time-pill">
                <DashboardIcon name="clock" /> {item.time}
              </span>
              <span className="dashboard-inline-badge">{item.mode}</span>
              <button type="button">Open Chart</button>
            </article>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Follow-up Performance" action="Export">
        <div className="dashboard-performance-grid">
          <article className="dashboard-performance-card">
            <span className="dashboard-icon-bubble">
              <DashboardIcon name="lightning" />
            </span>
            <h3>Fast Review Time</h3>
            <p>Average response time for patient questions is down to 18 minutes this week.</p>
          </article>

          <article className="dashboard-performance-card">
            <span className="dashboard-icon-bubble">
              <DashboardIcon name="message" />
            </span>
            <h3>Patient Communication</h3>
            <p>92% of follow-up messages were answered within the same consultation window.</p>
          </article>

          <article className="dashboard-performance-card">
            <span className="dashboard-icon-bubble">
              <DashboardIcon name="chart" />
            </span>
            <h3>Case Efficiency</h3>
            <p>Digital prescriptions reduced repeat administrative work across routine visits.</p>
          </article>
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
