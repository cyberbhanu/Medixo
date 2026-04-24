import Navbar from "../components/Navbar";
import heroDoctor from "../assets/medixo-hero-doctor.png";
import doctorArjun from "../assets/doctor-arjun.png";
import doctorPriya from "../assets/doctor-priya.png";
import doctorRohan from "../assets/doctor-rohan.png";
import doctorNeha from "../assets/doctor-neha.png";

const specialties = [
  { name: "Cardiology", count: "120+ Doctors", icon: "heart" },
  { name: "Orthopedics", count: "95+ Doctors", icon: "bone" },
  { name: "Neurology", count: "80+ Doctors", icon: "brain" },
  { name: "Pediatrics", count: "150+ Doctors", icon: "user" },
  { name: "Dermatology", count: "110+ Doctors", icon: "clinic" },
  { name: "Gynecology", count: "130+ Doctors", icon: "stetho" },
];

const doctors = [
  {
    name: "Dr. Arjun Sharma",
    specialty: "Cardiologist",
    exp: "10+ Years Exp.",
    rating: "4.8 (1200+)",
    location: "Delhi",
    fee: "₹800",
    image: doctorArjun,
  },
  {
    name: "Dr. Priya Patel",
    specialty: "Dermatologist",
    exp: "8+ Years Exp.",
    rating: "4.7 (980+)",
    location: "Mumbai",
    fee: "₹700",
    image: doctorPriya,
  },
  {
    name: "Dr. Rohan Verma",
    specialty: "Orthopedic",
    exp: "12+ Years Exp.",
    rating: "4.9 (1500+)",
    location: "Bangalore",
    fee: "₹900",
    image: doctorRohan,
  },
  {
    name: "Dr. Neha Singh",
    specialty: "Gynecologist",
    exp: "9+ Years Exp.",
    rating: "4.6 (870+)",
    location: "Lucknow",
    fee: "₹600",
    image: doctorNeha,
  },
];

const stats = [
  { value: "10,000+", label: "Verified Doctors", mobileLabel: "Doctors", icon: "doctor" },
  { value: "500+", label: "Hospitals", mobileLabel: "Hospitals", icon: "hospital" },
  { value: "50,000+", label: "Patients Served", mobileLabel: "Patients", icon: "people" },
  { value: "4.8/5", label: "User Ratings", mobileLabel: "Ratings", icon: "star" },
];

const trustPoints = [
  { label: "Verified Doctors", icon: "check" },
  { label: "Easy Booking", icon: "calendar" },
  { label: "Secure Payments", icon: "card" },
];

const footerFeatures = [
  { title: "Easy Appointment", icon: "calendarLarge" },
  { title: "Verified Doctors", icon: "shield" },
  { title: "Secure Payments", icon: "lock" },
  { title: "24/7 Support", icon: "headset" },
];

function Icon({ name }) {
  const paths = {
    search: <path d="m14 14-3.1-3.1m1-4.4a5.4 5.4 0 1 1-10.8 0 5.4 5.4 0 0 1 10.8 0Z" />,
    pin: <path d="M8 14s4.5-4.1 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.9 8 14 8 14Zm0-5.8a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" />,
    chevron: <path d="m6 4 4 4-4 4" />,
    check: <path d="m3 8 3.1 3.1L13 4.5M2.5 2.5h11v11h-11v-11Z" />,
    calendar: <path d="M4.5 2v2m7-2v2M2.5 5h11m-10 8.5h9A1 1 0 0 0 13.5 12V4A1 1 0 0 0 12.5 3h-9a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1.5Z" />,
    card: <path d="M2.5 5h11v7.5h-11V5Zm0 2.5h11M5 10.5h2" />,
    heart: <path d="M8 13.4 2.9 8.5a3.2 3.2 0 0 1 4.6-4.4l.5.5.5-.5a3.2 3.2 0 0 1 4.6 4.4L8 13.4Z" />,
    bone: <path d="M5.4 5.2 10.8 11m-7.2-.6a2 2 0 1 1 1.9 1.9 2 2 0 1 1-1.9-1.9Zm6.9-6.9a2 2 0 1 1 1.9 1.9 2 2 0 1 1-1.9-1.9Z" />,
    brain: <path d="M6.2 13.5c-1.6 0-3.2-1-3.2-2.9 0-.9.4-1.7 1-2.2A3 3 0 0 1 6.9 3c.5-1 1.7-1.4 2.9-1 1.1.3 1.8 1.2 1.9 2.3A3 3 0 0 1 12 10c0 1.9-1.5 3.5-3.5 3.5H6.2Zm1.8-10v10M5 7h6M5.5 10h5" />,
    user: <path d="M8 8.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6.3c.5-2.7 2.4-4.2 5-4.2s4.5 1.5 5 4.2H3Z" />,
    clinic: <path d="M3 14V5.5L8 2l5 3.5V14H9.8V9.8H6.2V14H3Zm3.7-8h2.6M8 4.7v2.6" />,
    stetho: <path d="M4 3v3.2a3 3 0 1 0 6 0V3M3 3h2m4 0h2m-1 6.5c0 2 1.2 3 3 3a1.5 1.5 0 1 0 0-3" />,
    pulse: <path d="M2 8h2.6l1-2.2L8 11.5l1.7-5 1.2 1.5H14M8 14 3.4 9.7a4 4 0 0 1-.9-4.4A3.2 3.2 0 0 1 8 4.3a3.2 3.2 0 0 1 5.5 1" />,
    doctor: <path d="M8 8.3a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Zm-5 6.2c.5-2.8 2.3-4.3 5-4.3s4.5 1.5 5 4.3M8 11.4v2.4m-1.2-1.2h2.4" />,
    hospital: <path d="M3 14V2.5h7V6h3v8M5 5h3M5 8h3M5 11h3m2-2h1.5m-1.5 2h1.5" />,
    people: <path d="M6.5 8a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Zm-4 6c.4-2.5 1.9-4 4-4s3.6 1.5 4 4m.4-5.7a2.2 2.2 0 1 0 0-4.4m1.1 6.3c1 .6 1.7 1.8 2 3.8" />,
    star: <path d="m8 2.2 1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11l-3.5 1.9.7-3.9-2.8-2.7 3.9-.6L8 2.2Z" />,
    rupee: <path d="M4 3h8M4 6h8M5 3c5 0 5 5.5 0 5.5L10.2 14" />,
    clock: <path d="M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13Zm0-9v3.2l2.2 1.3" />,
    calendarLarge: <path d="M5 2v3m6-3v3M2.5 6h11M4 4h8a1.5 1.5 0 0 1 1.5 1.5V13A1.5 1.5 0 0 1 12 14.5H4A1.5 1.5 0 0 1 2.5 13V5.5A1.5 1.5 0 0 1 4 4Zm1 5h2m2 0h2m-6 2.5h2m2 0h2" />,
    shield: <path d="M8 1.8 13 4v3.9c0 3-2 5.4-5 6.3-3-.9-5-3.3-5-6.3V4l5-2.2Zm-2.3 6.4L7.2 10 10.8 6" />,
    lock: <path d="M4 7h8v6.5H4V7Zm2 0V5.3a2 2 0 1 1 4 0V7" />,
    headset: <path d="M2.5 9v-1a5.5 5.5 0 1 1 11 0v1M4 8.5H2.5v3H4v-3Zm8 0h1.5v3H12v-3Zm0 3c-.4 1.4-1.6 2.2-3.5 2.2H8" />,
  };

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function SearchPanel() {
  return (
    <div className="search-panel" aria-label="Find doctors">
      <label>
        <Icon name="search" />
        <input type="search" placeholder="Search doctors, specialties..." />
      </label>
      <label>
        <select defaultValue="">
          <option value="" disabled>Select Specialization</option>
          <option>Cardiology</option>
          <option>Orthopedics</option>
          <option>Neurology</option>
          <option>Pediatrics</option>
        </select>
      </label>
      <label>
        <Icon name="pin" />
        <select defaultValue="">
          <option value="" disabled>Select Location</option>
          <option>Delhi</option>
          <option>Mumbai</option>
          <option>Bangalore</option>
          <option>Lucknow</option>
        </select>
      </label>
      <button type="button">Search</button>
    </div>
  );
}

function SectionHeader({ title, children }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {children}
      <a href="/">
        View All <Icon name="chevron" />
      </a>
    </div>
  );
}

function SpecialtyCard({ item }) {
  return (
    <article className="specialty-card">
      <span className="soft-icon">
        <Icon name={item.icon} />
      </span>
      <div>
        <h3>{item.name}</h3>
        <p>{item.count}</p>
      </div>
    </article>
  );
}

function DoctorCard({ doctor }) {
  return (
    <article className="doctor-card">
      <img src={doctor.image} alt={doctor.name} />
      <div className="doctor-card-content">
        <h3>{doctor.name}</h3>
        <p>{doctor.specialty}</p>
        <div className="doctor-meta">
          <span><Icon name="clock" /> {doctor.exp}</span>
          <span className="rating">★ {doctor.rating}</span>
        </div>
        <div className="doctor-bottom">
          <span><Icon name="pin" /> {doctor.location}</span>
          <strong>{doctor.fee}</strong>
        </div>
        <button type="button">Book Now</button>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <main className="home-page">
      <Navbar />

      <section className="hero-section">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <h1>
              Book Appointments <br />
              with <span>Trusted Doctors</span>
            </h1>
            <p>
              Find experienced doctors, book appointments instantly and get quality
              healthcare at your convenience.
            </p>

            <div className="trust-row">
              {trustPoints.map((item) => (
                <span key={item.label}>
                  <Icon name={item.icon} /> {item.label}
                </span>
              ))}
            </div>

            <SearchPanel />

            <div className="popular-searches">
              <strong>Popular Searches:</strong>
              <a href="/">Dentist</a>
              <a href="/">Cardiologist</a>
              <a href="/">Orthopedist</a>
              <a href="/">Pediatrician</a>
              <a href="/">Neurologist</a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <img src={heroDoctor} alt="" />
            <div className="care-badge">
              <Icon name="pulse" />
              <strong>24/7</strong>
              <span>Care Support</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section shell" aria-label="Medixo statistics">
        <div className="stats-card">
          {stats.map((item) => (
            <div className="stat-item" key={item.label}>
              <span className="soft-icon">
                <Icon name={item.icon} />
              </span>
              <div>
                <strong>{item.value}</strong>
                <p>
                  <span className="desktop-label">{item.label}</span>
                  <span className="mobile-label">{item.mobileLabel}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section shell" id="specializations">
        <SectionHeader title="Top Specializations" />
        <div className="specialty-grid">
          {specialties.map((item) => (
            <SpecialtyCard item={item} key={item.name} />
          ))}
          <button className="slider-next" type="button" aria-label="Next specializations">
            <Icon name="chevron" />
          </button>
        </div>
      </section>

      <section className="content-section shell doctors-section" id="doctors">
        <SectionHeader title="Top Doctors">
          <div className="doctor-tabs" aria-label="Doctor categories">
            <button className="active" type="button">All Doctors</button>
            <button type="button">Cardiologist</button>
            <button type="button">Dermatologist</button>
            <button type="button">Neurologist</button>
          </div>
        </SectionHeader>
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <DoctorCard doctor={doctor} key={doctor.name} />
          ))}
        </div>
      </section>

      <section className="feature-strip" aria-label="Service highlights">
        <div className="shell feature-strip-inner">
          {footerFeatures.map((feature) => (
            <div className="feature-item" key={feature.title}>
              <span>
                <Icon name={feature.icon} />
              </span>
              <strong>{feature.title}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
