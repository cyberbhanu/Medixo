import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroDoctor from "../assets/medixo-hero-doctor.png";
import doctorArjun from "../assets/doctor-arjun.png";
import doctorPriya from "../assets/doctor-priya.png";
import doctorRohan from "../assets/doctor-rohan.png";
import "../styles/home.css";
import doctorNeha from "../assets/doctor-neha.png";
import { getHomepageData } from "../api";

const doctorAvatarImages = [doctorArjun, doctorPriya, doctorRohan, doctorNeha];

const getDoctorCategory = (specialization) => {
  const normalized = (specialization || "").toLowerCase();

  if (normalized.includes("cardio")) return "Cardiology";
  if (normalized.includes("ortho")) return "Orthopedics";
  if (normalized.includes("neuro")) return "Neurology";
  if (normalized.includes("pedi")) return "Pediatrics";
  if (normalized.includes("derma")) return "Dermatology";
  if (normalized.includes("gyn")) return "Gynecology";

  return "Other";
};

const getSpecialtyIcon = (category) => {
  switch (category) {
    case "Cardiology":
      return "heart";
    case "Orthopedics":
      return "bone";
    case "Neurology":
      return "brain";
    case "Pediatrics":
      return "user";
    case "Dermatology":
      return "clinic";
    case "Gynecology":
      return "stetho";
    default:
      return "clinic";
  }
};

const pageConfig = {
  healthPackages: {
    cards: [
      { title: "Annual Wellness", description: "Health screening and consultation bundle." },
      { title: "Family Care", description: "Shared care for adults and children." },
      { title: "Chronic Care", description: "Follow-up support for diabetes, heart care, and more." },
    ],
  },
  about: {
    cards: [
      { title: "For Patients", description: "Search doctors by city, specialty, clinic, fee, and availability." },
      { title: "For Doctors", description: "Doctors can maintain clinic details and review appointment requests." },
      { title: "For Admins", description: "Admins list doctors, update profiles, and monitor city-wide bookings." },
    ],
  },
};

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

const DEFAULT_FILTERS = {
  query: "",
  type: "all",
  specialty: "",
  city: "",
  department: "",
  minExperience: "",
  maxFees: "",
  minRating: "",
  availability: "",
  consultationType: "",
};

const includesText = (value, query) =>
  String(value || "").toLowerCase().includes(String(query || "").toLowerCase());

const asArray = (value) => (Array.isArray(value) ? value : []);

const isValidRecord = (item) => item && typeof item === "object" && item._id && item.isActive !== false;

const uniqueSorted = (items) =>
  [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

const getDepartmentName = (department) => {
  if (!department) return "";
  if (typeof department === "string") return department;
  return department.name || "";
};

const getResourceCity = (item) => item.city || item.location || "";

const getSearchText = (item, fields = []) =>
  fields
    .flatMap((field) => {
      const value = field.split(".").reduce((current, key) => current?.[key], item);
      if (Array.isArray(value)) {
        return value.map((entry) => (typeof entry === "object" ? Object.values(entry).join(" ") : entry));
      }
      return typeof value === "object" && value ? Object.values(value).join(" ") : value;
    })
    .join(" ");

const doctorMatchesFilters = (doctor, filters) => {
  const query = filters.query.trim();
  const departmentName = getDepartmentName(doctor.department);
  const departmentId = typeof doctor.department === "object" ? doctor.department?._id : doctor.department;
  const searchText = getSearchText(doctor, [
    "name",
    "qualification",
    "specialization",
    "location",
    "shortDescription",
    "about",
    "treatmentsOffered",
    "diseasesTreated",
    "hospitalClinicDetails.hospitalName",
    "hospitalClinicDetails.clinicName",
    "hospitalClinicDetails.clinicAddress",
    "hospitalClinicDetails.services",
  ]);

  return (
    (!query || includesText(searchText, query)) &&
    (!filters.specialty || doctor.specialization === filters.specialty) &&
    (!filters.city || getDoctorCity(doctor) === filters.city) &&
    (!filters.department || departmentId === filters.department || departmentName === filters.department) &&
    (!filters.minExperience || Number(doctor.experience || 0) >= Number(filters.minExperience)) &&
    (!filters.maxFees || Number(doctor.fees || 0) <= Number(filters.maxFees)) &&
    (!filters.minRating || Number(doctor.rating || 0) >= Number(filters.minRating)) &&
    (!filters.availability || isAvailableToday(doctor)) &&
    (!filters.consultationType || doctor.consultationType === filters.consultationType)
  );
};

const facilityMatchesFilters = (item, filters) => {
  const query = filters.query.trim();
  const departments = asArray(item.departments).map(getDepartmentName);
  const departmentIds = asArray(item.departments).map((department) =>
    typeof department === "object" ? department._id : department
  );
  const searchText = getSearchText(item, [
    "name",
    "address",
    "city",
    "state",
    "about",
    "facilities",
    "departments",
    "doctors",
  ]);

  return (
    (!query || includesText(searchText, query)) &&
    (!filters.city || getResourceCity(item) === filters.city) &&
    (!filters.department || departments.includes(filters.department) || departmentIds.includes(filters.department)) &&
    (!filters.minRating || Number(item.rating || 0) >= Number(filters.minRating))
  );
};

const labMatchesFilters = (lab, filters) => {
  const query = filters.query.trim();
  const searchText = getSearchText(lab, ["name", "address", "location", "availableTests", "hospitals"]);

  return (
    (!query || includesText(searchText, query)) &&
    (!filters.city || getResourceCity(lab) === filters.city) &&
    (!filters.minRating || Number(lab.rating || 0) >= Number(filters.minRating))
  );
};

const getFacilityName = (doctor) =>
  doctor.hospitalClinicDetails?.clinicName ||
  doctor.hospitalClinicDetails?.hospitalName ||
  doctor.clinic?.name ||
  doctor.hospital?.name ||
  doctor.clinics?.[0]?.name ||
  doctor.hospitals?.[0]?.name ||
  "Independent Practice";

const getDoctorCity = (doctor) =>
  doctor.location ||
  doctor.clinic?.city ||
  doctor.hospital?.city ||
  doctor.clinics?.[0]?.city ||
  doctor.hospitals?.[0]?.city ||
  "";

const isAvailableToday = (doctor) => {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return doctor.availability?.some((slot) => slot.day === today && slot.isAvailable);
};

const getNextSlot = (doctor) => {
  if (doctor.nextAvailableSlot) return doctor.nextAvailableSlot;
  const slot = doctor.availability?.find((item) => item.isAvailable);
  return slot ? `${slot.day}, ${slot.startTime || "09:00"}` : "Call clinic";
};

const getDoctorDescription = (doctor) =>
  doctor.shortDescription ||
  doctor.about ||
  `${doctor.specialization} care with ${doctor.experience || 0}+ years of clinical experience.`;

function SearchPanel({ filters, onFiltersChange, specialtyOptions, cityOptions, departmentOptions }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onFiltersChange({ ...filters, query: filters.query.trim() });
  };

  return (
    <form className="search-panel" aria-label="Find doctors" onSubmit={handleSubmit}>
      <label>
        <Icon name="search" />
        <input
          type="search"
          placeholder="Search doctors, hospitals, clinics, treatments, diseases..."
          value={filters.query}
          onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
        />
      </label>
      <label>
        <select value={filters.type} onChange={(event) => onFiltersChange({ ...filters, type: event.target.value })}>
          <option value="all">All</option>
          <option value="doctor">Doctors</option>
          <option value="hospital">Hospitals</option>
          <option value="clinic">Clinics</option>
          <option value="lab">Labs</option>
        </select>
      </label>
      <label>
        <select value={filters.specialty} onChange={(event) => onFiltersChange({ ...filters, specialty: event.target.value })}>
          <option value="">Select Specialization</option>
          {specialtyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label>
        <Icon name="pin" />
        <select value={filters.city} onChange={(event) => onFiltersChange({ ...filters, city: event.target.value })}>
          <option value="">City</option>
          {cityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <button type="submit">Search</button>
      <div className="home-filter-row" aria-label="Homepage filters">
        <select value={filters.department} onChange={(event) => onFiltersChange({ ...filters, department: event.target.value })}>
          <option value="">Department</option>
          {departmentOptions.map((item) => <option key={item._id || item.name} value={item._id || item.name}>{item.name}</option>)}
        </select>
        <select value={filters.minExperience} onChange={(event) => onFiltersChange({ ...filters, minExperience: event.target.value })}>
          <option value="">Experience</option>
          <option value="1">1+ years</option>
          <option value="5">5+ years</option>
          <option value="10">10+ years</option>
          <option value="15">15+ years</option>
        </select>
        <select value={filters.maxFees} onChange={(event) => onFiltersChange({ ...filters, maxFees: event.target.value })}>
          <option value="">Fee</option>
          <option value="500">Up to Rs. 500</option>
          <option value="1000">Up to Rs. 1000</option>
          <option value="1500">Up to Rs. 1500</option>
          <option value="2500">Up to Rs. 2500</option>
        </select>
        <select value={filters.minRating} onChange={(event) => onFiltersChange({ ...filters, minRating: event.target.value })}>
          <option value="">Rating</option>
          <option value="4">4+ rating</option>
          <option value="4.5">4.5+ rating</option>
        </select>
        <select value={filters.availability} onChange={(event) => onFiltersChange({ ...filters, availability: event.target.value })}>
          <option value="">Availability</option>
          <option value="today">Available today</option>
        </select>
        <select value={filters.consultationType} onChange={(event) => onFiltersChange({ ...filters, consultationType: event.target.value })}>
          <option value="">Consultation</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Online/Offline">Online/Offline</option>
        </select>
        <button type="button" className="home-clear-filter" onClick={() => onFiltersChange(DEFAULT_FILTERS)}>
          Clear
        </button>
      </div>
    </form>
  );
}

function SectionHeader({ title, children, linkTo = "/info/specializations" }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {children}
      <Link to={linkTo}>
        View All <Icon name="chevron" />
      </Link>
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

function DoctorCard({ doctor, onBook, onView }) {
  const languages = doctor.languages?.length ? doctor.languages.join(", ") : "English, Hindi";
  const facilityName = getFacilityName(doctor);
  const availableToday = isAvailableToday(doctor);

  return (
    <article className="doctor-card premium-doctor-card">
      {doctor.profileImage || doctor.image ? (
        <img src={doctor.profileImage || doctor.image} alt={doctor.name} loading="lazy" />
      ) : (
        <div className="doctor-card-avatar" aria-hidden="true">
          {doctor.name?.charAt(0) || "D"}
        </div>
      )}
      <div className="doctor-card-content">
        <div className="doctor-card-title-row">
          <h3>Dr. {doctor.name}</h3>
          <span className="rating"><Icon name="star" /> {Number(doctor.rating || 4.8).toFixed(1)} ({doctor.reviewCount || 0})</span>
        </div>
        <p>{doctor.qualification || "Verified Medical Practitioner"}</p>
        <strong className="doctor-specialization">{doctor.specialization}</strong>
        <div className="doctor-meta">
          <span><Icon name="clock" /> {doctor.experience}+ yrs</span>
          <span><Icon name="pin" /> {getDoctorCity(doctor)}</span>
          <span>{languages}</span>
        </div>
        <p className="doctor-card-description">{getDoctorDescription(doctor)}</p>
        <div className="doctor-badge-row">
          <span className={availableToday ? "availability-badge available" : "availability-badge"}>
            {availableToday ? "Available Today" : "Next Slot"}
          </span>
          <span className="availability-badge">{doctor.consultationType || "Offline"}</span>
          <span className="availability-badge">{getNextSlot(doctor)}</span>
        </div>
        <div className="doctor-bottom">
          <span><Icon name="hospital" /> {facilityName}</span>
          <strong>Rs. {doctor.fees}</strong>
        </div>
        <div className="home-card-actions">
          <button type="button" onClick={() => onView(doctor)}>View Profile</button>
          <button type="button" className="secondary-card-action" onClick={() => onBook(doctor)}>Book Appointment</button>
        </div>
      </div>
    </article>
  );
}

function HospitalCard({ item, type, onView, onBook }) {
  const departments = item.departments?.map((department) => department.name || department).filter(Boolean) || [];
  const doctorCount = item.doctors?.length || 0;

  return (
    <article className="resource-card">
      <div className="resource-media">
        {item.logo || item.image ? (
          <img src={item.logo || item.image} alt={item.name} loading="lazy" />
        ) : (
          <span><Icon name={type === "hospital" ? "hospital" : "clinic"} /></span>
        )}
      </div>
      <div className="resource-body">
        <div className="doctor-card-title-row">
          <h3>{item.name}</h3>
          <span className="rating"><Icon name="star" /> {Number(item.rating || 4.6).toFixed(1)}</span>
        </div>
        <p>{item.address || "Address will be updated soon"}</p>
        <div className="resource-meta">
          <span>{item.city || "City pending"}{item.state ? `, ${item.state}` : ""}</span>
          <span>{item.phone || "Contact pending"}</span>
          <span>{item.email || "Email pending"}</span>
          <span>{doctorCount} doctors</span>
          <span>{item.openingHours || "Hours pending"}</span>
          {type === "hospital" ? <span>{item.emergencyAvailable ? "Emergency available" : "Emergency not listed"}</span> : null}
        </div>
        {departments.length ? (
          <div className="doctor-badge-row">
            {departments.slice(0, 4).map((department) => <span key={department} className="availability-badge">{department}</span>)}
          </div>
        ) : null}
        <div className="home-card-actions">
          <button type="button" onClick={() => onView(item)}>{type === "hospital" ? "View Hospital" : "View Clinic"}</button>
          <button type="button" className="secondary-card-action" onClick={() => onBook(item)}>Book Appointment</button>
        </div>
      </div>
    </article>
  );
}

function LabCard({ lab, onView, onBook }) {
  const tests = lab.availableTests?.map((test) => test.name || test).filter(Boolean) || [];

  return (
    <article className="resource-card">
      <div className="resource-media">
        {lab.logo ? <img src={lab.logo} alt={lab.name} loading="lazy" /> : <span><Icon name="pulse" /></span>}
      </div>
      <div className="resource-body">
        <div className="doctor-card-title-row">
          <h3>{lab.name}</h3>
          <span className="rating"><Icon name="star" /> {Number(lab.rating || 4.7).toFixed(1)}</span>
        </div>
        <p>{lab.address || lab.location || "Address will be updated soon"}</p>
        <div className="doctor-badge-row">
          <span className="availability-badge">{lab.homeSampleCollection ? "Home collection" : "Center visit"}</span>
          {(tests.length ? tests : ["Tests updating soon"]).slice(0, 4).map((test) => (
            <span key={test} className="availability-badge">{test}</span>
          ))}
        </div>
        <div className="home-card-actions">
          <button type="button" onClick={() => onView(lab)}>View Details</button>
          <button type="button" className="secondary-card-action" onClick={() => onBook(lab)}>Book Test</button>
        </div>
      </div>
    </article>
  );
}

function InfoCard({ card }) {
  return (
    <article className="info-card">
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <Link className="home-card-link" to={card.linkTo || "/doctors"}>
        Learn More
      </Link>
    </article>
  );
}

function HomeSkeletonGrid() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="home-skeleton-card" key={index}>
          <span />
          <strong />
          <p />
          <p />
        </div>
      ))}
    </>
  );
}

// Main Home Component
export default function Home() {
  const navigate = useNavigate();
  const [homepageData, setHomepageData] = useState({
    doctors: [],
    hospitals: [],
    clinics: [],
    labs: [],
    departments: [],
  });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("All Doctors");

  useEffect(() => {
    const loadHomepageData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getHomepageData();
        setHomepageData({
          doctors: asArray(data.doctors).filter(isValidRecord),
          hospitals: asArray(data.hospitals).filter(isValidRecord),
          clinics: asArray(data.clinics).filter(isValidRecord),
          labs: asArray(data.labs).filter(isValidRecord),
          departments: asArray(data.departments).filter(isValidRecord),
        });
      } catch (error) {
        console.error("Failed to load homepage data", error);
        setError(error.response?.data?.error || "Failed to load homepage data");
        setHomepageData({ doctors: [], hospitals: [], clinics: [], labs: [], departments: [] });
      } finally {
        setLoading(false);
      }
    };

    loadHomepageData();
  }, []);

  const { doctors, hospitals, clinics, labs, departments } = homepageData;

  const specialtyOptions = useMemo(
    () => uniqueSorted(doctors.map((doctor) => doctor.specialization)),
    [doctors]
  );

  const cityOptions = useMemo(
    () => uniqueSorted([
      ...doctors.map(getDoctorCity),
      ...hospitals.map(getResourceCity),
      ...clinics.map(getResourceCity),
      ...labs.map(getResourceCity),
    ]),
    [clinics, doctors, hospitals, labs]
  );

  const departmentOptions = useMemo(() => {
    const fromFacilities = [...hospitals, ...clinics]
      .flatMap((item) => asArray(item.departments))
      .filter(Boolean);
    const byId = new Map();

    [...departments, ...fromFacilities].forEach((department) => {
      const id = typeof department === "object" ? department._id || department.name : department;
      const name = getDepartmentName(department);
      if (id && name) {
        byId.set(id, { _id: id, name });
      }
    });

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [clinics, departments, hospitals]);

  const filteredDoctors = useMemo(() => {
    if (filters.type !== "all" && filters.type !== "doctor") return [];
    return doctors.filter((doctor) => doctorMatchesFilters(doctor, filters));
  }, [doctors, filters]);

  const filteredHospitals = useMemo(() => {
    if (filters.type !== "all" && filters.type !== "hospital") return [];
    return hospitals.filter((hospital) => facilityMatchesFilters(hospital, filters));
  }, [filters, hospitals]);

  const filteredClinics = useMemo(() => {
    if (filters.type !== "all" && filters.type !== "clinic") return [];
    return clinics.filter((clinic) => facilityMatchesFilters(clinic, filters));
  }, [clinics, filters]);

  const filteredLabs = useMemo(() => {
    if (filters.type !== "all" && filters.type !== "lab") return [];
    return labs.filter((lab) => labMatchesFilters(lab, filters));
  }, [filters, labs]);

  const specialtyGroups = useMemo(() => {
    const counts = filteredDoctors.reduce((accumulator, doctor) => {
      const category = getDoctorCategory(doctor.specialization);
      accumulator[category] = (accumulator[category] || 0) + 1;
      return accumulator;
    }, {});

    return [
      { name: "All Doctors", count: `${filteredDoctors.length} Doctors`, icon: "doctor" },
      ...Object.entries(counts).map(([name, count]) => ({
        name,
        count: `${count} Doctors`,
        icon: getSpecialtyIcon(name),
      })),
    ];
  }, [filteredDoctors]);

  const visibleDoctors = useMemo(() => {
    if (activeSpecialty === "All Doctors") {
      return filteredDoctors.slice(0, 8);
    }

    const filtered = filteredDoctors.filter((doctor) => getDoctorCategory(doctor.specialization) === activeSpecialty);
    return filtered.slice(0, 8);
  }, [activeSpecialty, filteredDoctors]);

  const visibleFacilities = useMemo(
    () => [
      ...filteredHospitals.map((item) => ({ item, type: "hospital" })),
      ...filteredClinics.map((item) => ({ item, type: "clinic" })),
    ].slice(0, 8),
    [filteredClinics, filteredHospitals]
  );

  const visibleLabs = useMemo(() => filteredLabs.slice(0, 8), [filteredLabs]);

  const stats = useMemo(
    () => [
      { label: "Active Doctors", mobileLabel: "Doctors", value: doctors.length, icon: "doctor" },
      { label: "Hospitals", mobileLabel: "Hospitals", value: hospitals.length, icon: "hospital" },
      { label: "Clinics", mobileLabel: "Clinics", value: clinics.length, icon: "clinic" },
      { label: "Laboratories", mobileLabel: "Labs", value: labs.length, icon: "pulse" },
    ],
    [clinics.length, doctors.length, hospitals.length, labs.length]
  );

  useEffect(() => {
    if (activeSpecialty !== "All Doctors" && !specialtyGroups.some((item) => item.name === activeSpecialty)) {
      setActiveSpecialty("All Doctors");
    }
  }, [activeSpecialty, specialtyGroups]);

  const handleBookDoctor = (doctor) => {
    if (!doctor?._id) {
      return;
    }

    sessionStorage.setItem("selectedDoctorId", doctor._id);
    navigate(`/doctors/${doctor._id}`);
  };

  const handleViewDoctor = (doctor) => {
    if (doctor?._id) {
      navigate(`/doctors/${doctor._id}`);
    }
  };

  const handleViewResource = (item) => {
    if (item?.name) {
      navigate(`/doctors?search=${encodeURIComponent(item.name)}`);
    }
  };

  const handleBookResource = (item) => {
    if (item?.name) {
      navigate(`/doctors?search=${encodeURIComponent(item.name)}`);
    } else {
      navigate("/doctors");
    }
  };

  return (
    <main className="home-page">
      <Navbar />

      <section className="hero-section">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <h1>
              Find Doctors in Your City and <span>Book Appointments</span>
            </h1>
            <p>
              Medixo helps patients compare verified doctors, clinic details, fees,
              and available appointment slots from one city-wide healthcare directory.
            </p>

            <div className="trust-row">
              {trustPoints.map((item) => (
                <span key={item.label}>
                  <Icon name={item.icon} /> {item.label}
                </span>
              ))}
            </div>

            <SearchPanel
              filters={filters}
              onFiltersChange={setFilters}
              specialtyOptions={specialtyOptions}
              cityOptions={cityOptions}
              departmentOptions={departmentOptions}
            />

            <div className="popular-searches">
              <strong>Popular Searches:</strong>
              <Link to="/doctors?search=Dentist">Dentist</Link>
              <Link to="/doctors?search=Cardiologist">Cardiologist</Link>
              <Link to="/doctors?search=Orthopedist">Orthopedist</Link>
              <Link to="/doctors?search=Pediatrician">Pediatrician</Link>
              <Link to="/doctors?search=Neurologist">Neurologist</Link>
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
        <div className="stats-section shell" aria-label="Medixo statistics">
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
        </div>
      </section>
      <section className="content-section shell" id="specializations">
        <SectionHeader title="Top Specializations" linkTo="/#specializations" />
        <div className="specialty-grid">
          {specialtyGroups.map((item) => (
            <article
              key={item.name}
              className={`specialty-card ${activeSpecialty === item.name ? "active" : ""}`}
              role="button"
              tabIndex="0"
              onClick={() => setActiveSpecialty(item.name)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveSpecialty(item.name)}
              style={{ cursor: "pointer" }}
            >
              <span className="soft-icon">
                <Icon name={item.icon} />
              </span>
              <div>
                <h3>{item.name}</h3>
                <p>{item.count}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section shell doctors-section" id="doctors">
        <SectionHeader title="Top Doctors" linkTo="/doctors">
          <div className="doctor-tabs" aria-label="Doctor categories">
            {specialtyGroups.map((item) => (
              <button
                key={item.name}
                className={activeSpecialty === item.name ? "active" : ""}
                type="button"
                onClick={() => setActiveSpecialty(item.name)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </SectionHeader>
        {error ? <p className="dashboard-empty-state">{error}</p> : null}
        <div className="doctor-grid">
          {loading ? (
            <HomeSkeletonGrid />
          ) : visibleDoctors.length ? (
            visibleDoctors.map((doctor, index) => (
              <DoctorCard
                doctor={{
                  ...doctor,
                  image: doctor.image || doctorAvatarImages[index % doctorAvatarImages.length],
                }}
                key={doctor._id}
                onBook={handleBookDoctor}
                onView={handleViewDoctor}
              />
            ))
          ) : (
            <p className="dashboard-empty-state">No active doctors match these filters yet.</p>
          )}
        </div>
      </section>

      <section className="content-section shell" id="hospitals">
        <SectionHeader title="Hospitals & Clinics" linkTo="/doctors">
          <p style={{ margin: 0, color: '#4d5f80' }}>Discover clinics, chambers, and hospital-based providers.</p>
        </SectionHeader>
        <div className="resource-grid">
          {loading ? (
            <HomeSkeletonGrid />
          ) : visibleFacilities.length ? (
            visibleFacilities.map(({ item, type }) => (
              <HospitalCard
                key={`${type}-${item._id}`}
                item={item}
                type={type}
                onView={handleViewResource}
                onBook={handleBookResource}
              />
            ))
          ) : (
            <p className="dashboard-empty-state">No active hospitals or clinics match these filters yet.</p>
          )}
        </div>
      </section>

      <section className="content-section shell" id="lab-tests">
        <SectionHeader title="Lab Tests" linkTo="/doctors">
          <p style={{ margin: 0, color: '#4d5f80' }}>Schedule diagnostics, pathology tests, and wellness screenings.</p>
        </SectionHeader>
        <div className="resource-grid">
          {loading ? (
            <HomeSkeletonGrid />
          ) : visibleLabs.length ? (
            visibleLabs.map((lab) => (
              <LabCard key={lab._id} lab={lab} onView={handleViewResource} onBook={handleBookResource} />
            ))
          ) : (
            <p className="dashboard-empty-state">No active laboratories match these filters yet.</p>
          )}
        </div>
      </section>

      <section className="content-section shell" id="health-packages">
        <SectionHeader title="Health Packages" linkTo="/doctors">
          <p style={{ margin: 0, color: '#4d5f80' }}>Explore annual plans, screening bundles, and family care packages.</p>
        </SectionHeader>
        <div className="specialty-grid">
          {pageConfig.healthPackages.cards.map((card) => (
            <InfoCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      <section className="content-section shell" id="about">
        <SectionHeader title="About Medixo" linkTo="/doctors">
          <p style={{ margin: 0, color: '#4d5f80' }}>
            Medixo helps patients discover doctors across a city and book appointments with confidence.
          </p>
        </SectionHeader>
        <div className="specialty-grid">
          {pageConfig.about.cards.map((card) => (
            <InfoCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      <section className="booking-cta-section shell" id="book-now">
        <div className="booking-cta">
          <div>
            <span>Ready to book?</span>
            <h2>Choose a doctor, review clinic details, and request your appointment.</h2>
            <p>
              Patients can compare specialties, fees, clinic locations, and available timings before submitting a booking request.
            </p>
          </div>
          <Link to="/doctors" className="booking-cta-link">
            Open Doctor Directory
          </Link>
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
