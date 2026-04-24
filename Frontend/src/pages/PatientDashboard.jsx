import DashboardLayout, {
  DashboardIcon,
  DashboardSection,
} from "../components/DashboardLayout";
import doctorArjun from "../assets/doctor-arjun.png";
import doctorPriya from "../assets/doctor-priya.png";
import doctorNeha from "../assets/doctor-neha.png";
import { getStoredUser } from "../utils/auth";

const stats = [
  { icon: "calendar", value: "3", label: "Upcoming Appointments", note: "Next one at 10:30 AM today" },
  { icon: "file", value: "12", label: "Medical Reports", note: "2 new reports added this week" },
  { icon: "shield", value: "94%", label: "Care Plan Progress", note: "On track with medication reminders" },
  { icon: "pulse", value: "4.8/5", label: "Wellness Score", note: "Stable across the last 30 days" },
];

const appointments = [
  {
    doctor: "Dr. Arjun Sharma",
    specialty: "Cardiologist",
    time: "Today, 10:30 AM",
    type: "Video consultation",
    status: "Confirmed",
  },
  {
    doctor: "Dr. Priya Patel",
    specialty: "Dermatologist",
    time: "26 Apr, 04:00 PM",
    type: "Clinic visit",
    status: "Reminder sent",
  },
  {
    doctor: "Dr. Neha Singh",
    specialty: "Gynecologist",
    time: "29 Apr, 11:15 AM",
    type: "Follow-up review",
    status: "Waiting for documents",
  },
];

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

const recommendedDoctors = [
  {
    image: doctorArjun,
    name: "Dr. Arjun Sharma",
    specialty: "Heart health follow-up",
    fee: "Rs. 800",
  },
  {
    image: doctorPriya,
    name: "Dr. Priya Patel",
    specialty: "Skin and allergy care",
    fee: "Rs. 700",
  },
  {
    image: doctorNeha,
    name: "Dr. Neha Singh",
    specialty: "Women's wellness",
    fee: "Rs. 600",
  },
];

export default function PatientDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Patient";

  return (
    <DashboardLayout
      role="Patient Dashboard"
      title={`Welcome back, ${firstName}`}
      subtitle="Track appointments, reports, reminders, and your ongoing care journey from one clean workspace."
      chips={["Secure records", "Live doctor updates", "Medication reminders"]}
      stats={stats}
      quickActions={[
        { icon: "plus", label: "Book Appointment", variant: "primary" },
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
      <DashboardSection title="Upcoming Appointments" action="View Calendar">
        <div className="dashboard-card-list">
          {appointments.map((item) => (
            <article key={`${item.doctor}-${item.time}`} className="dashboard-appointment-card">
              <div>
                <span className="dashboard-inline-badge">{item.status}</span>
                <h3>{item.doctor}</h3>
                <p>{item.specialty}</p>
              </div>
              <div className="dashboard-detail-stack">
                <span>
                  <DashboardIcon name="calendar" /> {item.time}
                </span>
                <span>
                  <DashboardIcon name="stetho" /> {item.type}
                </span>
              </div>
              <button type="button">Open Details</button>
            </article>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Recommended Doctors" action="See More">
        <div className="dashboard-doctor-grid">
          {recommendedDoctors.map((doctor) => (
            <article key={doctor.name} className="dashboard-recommend-card">
              <img src={doctor.image} alt={doctor.name} />
              <div>
                <h3>{doctor.name}</h3>
                <p>{doctor.specialty}</p>
                <strong>{doctor.fee}</strong>
              </div>
              <button type="button">Book Follow-up</button>
            </article>
          ))}
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
