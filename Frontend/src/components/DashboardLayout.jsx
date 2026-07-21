import Navbar from "./Navbar";
import "../styles/dashboard.css";

const iconPaths = {
  calendar: <path d="M4.5 2v2m7-2v2M2.5 5h11m-10 8.5h9A1 1 0 0 0 13.5 12V4A1 1 0 0 0 12.5 3h-9a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1.5Z" />,
  pulse: <path d="M2 8h2.6l1-2.2L8 11.5l1.7-5 1.2 1.5H14" />,
  file: <path d="M4 2.5h5l3 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Zm4 .2V6h3" />,
  shield: <path d="M8 1.8 13 4v3.9c0 3-2 5.4-5 6.3-3-.9-5-3.3-5-6.3V4l5-2.2Zm-2.3 6.4L7.2 10 10.8 6" />,
  rupee: <path d="M4 3h8M4 6h8M5 3c5 0 5 5.5 0 5.5L10.2 14" />,
  users: <path d="M6.5 8a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Zm-4 6c.4-2.5 1.9-4 4-4s3.6 1.5 4 4m.4-5.7a2.2 2.2 0 1 0 0-4.4m1.1 6.3c1 .6 1.7 1.8 2 3.8" />,
  star: <path d="m8 2.2 1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11l-3.5 1.9.7-3.9-2.8-2.7 3.9-.6L8 2.2Z" />,
  clock: <path d="M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13Zm0-9v3.2l2.2 1.3" />,
  check: <path d="m3 8 3.1 3.1L13 4.5" />,
  plus: <path d="M8 3v10M3 8h10" />,
  chart: <path d="M3 12.5h10M5 11V7m3 4V4.5m3 6.5V8.5" />,
  message: <path d="M3 4.5h10v6H6.5L3 13V4.5Z" />,
  stetho: <path d="M4 3v3.2a3 3 0 1 0 6 0V3M3 3h2m4 0h2m-1 6.5c0 2 1.2 3 3 3a1.5 1.5 0 1 0 0-3" />,
  bell: <path d="M8 14a1.7 1.7 0 0 0 1.6-1H6.4A1.7 1.7 0 0 0 8 14Zm4-2H4l1-1.4V7.4a3 3 0 1 1 6 0v3.2L12 12Z" />,
  lightning: <path d="M8.7 1.8 4.8 8h2.4L6.6 14.2 11.3 7H8.8l-.1-5.2Z" />,
};

export function DashboardIcon({ name }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function StatCard({ item }) {
  return (
    <article className="dashboard-stat-card">
      <span className="dashboard-icon-bubble">
        <DashboardIcon name={item.icon} />
      </span>
      <div>
        <strong>{item.value}</strong>
        <p>{item.label}</p>
        {item.note && <small>{item.note}</small>}
      </div>
    </article>
  );
}

export function DashboardSection({ title, action, onActionClick, children }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <h2>{title}</h2>
        {action ? <button type="button" onClick={onActionClick}>{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

export default function DashboardLayout({
  role,
  title,
  subtitle,
  chips,
  stats,
  quickActions,
  children,
  aside,
}) {
  return (
    <main className="dashboard-page">
      <Navbar />

      <section className="dashboard-hero">
        <div className="shell dashboard-hero-inner">
          <div>
            <span className="dashboard-role-badge">{role}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>

            <div className="dashboard-chip-row">
              {chips.map((chip) => (
                <span key={chip} className="dashboard-chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="dashboard-quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={action.variant || "secondary"}
                onClick={action.onClick}
              >
                <DashboardIcon name={action.icon} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
        <div className="shell dashboard-stat-grid">
          {stats.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
      </section>
      <section className="shell dashboard-content-grid">
        <div className="dashboard-main-column">{children}</div>
        <aside className="dashboard-side-column">{aside}</aside>
      </section>
    </main>
  );
}
