import { useEffect, useMemo, useState } from "react";
import { getLabTests, updateAppointment } from "../api";
import DashboardLayout, {
  DashboardIcon,
  DashboardSection,
} from "../components/DashboardLayout";
import { getStoredUser } from "../utils/auth";

const ACTIVE_STATUSES = ["Scheduled", "Approved", "Rescheduled"];

export default function LaboratoryDashboard() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "Lab";
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [reportDrafts, setReportDrafts] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTests = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getLabTests();
      setTests(data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load laboratory bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const updateTest = async (testId, payload) => {
    setSavingId(testId);
    setError("");
    setSuccess("");

    try {
      await updateAppointment(testId, payload);
      setSuccess("Test booking updated successfully");
      await loadTests();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to update test booking");
    } finally {
      setSavingId("");
    }
  };

  const stats = useMemo(() => {
    const active = tests.filter((test) => ACTIVE_STATUSES.includes(test.status)).length;
    const completed = tests.filter((test) => test.status === "Completed").length;
    const rejected = tests.filter((test) => test.status === "Rejected").length;

    return [
      {
        icon: "file",
        value: String(tests.length),
        label: "Assigned Tests",
        note: "Only bookings assigned to your laboratory are shown",
      },
      {
        icon: "clock",
        value: String(active),
        label: "In Progress",
        note: "Scheduled, approved, or rescheduled tests",
      },
      {
        icon: "check",
        value: String(completed),
        label: "Completed",
        note: "Tests marked complete by your lab",
      },
      {
        icon: "shield",
        value: String(rejected),
        label: "Rejected",
        note: "Rejected lab bookings",
      },
    ];
  }, [tests]);

  const recentActivity = tests.slice(0, 4).map(
    (test) => `${test.patientName} - ${test.status} - ${test.appointmentDate}`
  );

  return (
    <DashboardLayout
      role="Laboratory Dashboard"
      title={`Lab workspace for ${firstName}`}
      subtitle="Manage assigned test bookings, update reports, and close completed laboratory work from your own secured queue."
      chips={["Assigned tests", "Report uploads", "Scoped access"]}
      stats={stats}
      quickActions={[
        { icon: "chart", label: "Refresh Data", variant: "primary", onClick: loadTests },
        { icon: "file", label: "Reports" },
        { icon: "clock", label: "History" },
      ]}
      aside={
        <DashboardSection title="Recent Test Activity">
          <div className="dashboard-mini-list">
            {recentActivity.length ? (
              recentActivity.map((item) => (
                <div key={item} className="dashboard-mini-row">
                  <span className="dashboard-mini-dot" />
                  <p>{item}</p>
                </div>
              ))
            ) : (
              <p className="dashboard-empty-state">No assigned tests yet.</p>
            )}
          </div>
        </DashboardSection>
      }
    >
      {error ? <div className="dashboard-banner error">{error}</div> : null}
      {success ? <div className="dashboard-banner success">{success}</div> : null}

      <DashboardSection title="Assigned Test Bookings" action="Laboratory only">
        <div className="dashboard-table">
          {loading ? (
            <p className="dashboard-empty-state">Loading tests...</p>
          ) : tests.length ? (
            tests.map((test) => (
              <article key={test._id} className="dashboard-table-row dashboard-patient-row">
                <div className="dashboard-patient-row-header">
                  <div>
                    <h3>{test.patientName}</h3>
                    <p>{test.testName || test.reason}</p>
                    <p className="dashboard-muted-note">
                      {test.referredBy?.name ? `Referred by ${test.referredBy.name}` : "Direct lab booking"}
                    </p>
                  </div>
                  <div className="dashboard-action-row">
                    <span className="dashboard-time-pill">
                      <DashboardIcon name="calendar" /> {test.appointmentDate}
                    </span>
                    <span className="dashboard-inline-badge">{test.status}</span>
                  </div>
                </div>

                <div className="dashboard-record-meta">
                  <span>
                    <DashboardIcon name="clock" /> {test.appointmentTime}
                  </span>
                  <span>
                    <DashboardIcon name="message" /> {test.patientEmail}
                  </span>
                  <span>
                    <DashboardIcon name="users" /> {test.patientPhone}
                  </span>
                </div>

                <label className="dashboard-input-group full-width">
                  <span>Report URL</span>
                  <input
                    type="url"
                    value={reportDrafts[test._id] ?? test.reportUrl ?? ""}
                    onChange={(event) =>
                      setReportDrafts((current) => ({ ...current, [test._id]: event.target.value }))
                    }
                    placeholder="https://example.com/report.pdf"
                  />
                </label>

                <div className="dashboard-action-row">
                  <button
                    type="button"
                    className="dashboard-secondary-action"
                    onClick={() => updateTest(test._id, { status: "Approved" })}
                    disabled={savingId === test._id}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="dashboard-secondary-action"
                    onClick={() => updateTest(test._id, { status: "Rejected" })}
                    disabled={savingId === test._id}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="dashboard-primary-action dashboard-compact-action"
                    onClick={() =>
                      updateTest(test._id, {
                        status: "Completed",
                        reportUrl: reportDrafts[test._id] ?? test.reportUrl ?? "",
                      })
                    }
                    disabled={savingId === test._id}
                  >
                    {savingId === test._id ? "Saving..." : "Mark Completed"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="dashboard-empty-state">
              No test bookings are assigned to your laboratory yet.
            </p>
          )}
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
