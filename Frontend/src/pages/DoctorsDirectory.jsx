import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDoctors, getSpecialties, getCities } from "../api";
import Navbar from "../components/Navbar";
import "../styles/doctors-directory.css";

function Icon({ name }) {
  const paths = {
    hospital: (
      <path d="M3 14V2.5h7V6h3v8M5 5h3M5 8h3M5 11h3m2-2h1.5m-1.5 2h1.5" />
    ),
    phone: (
      <path d="M7.3 2.8 9 6.6 7.5 8.1c.8 1.6 2 2.8 3.6 3.6l1.5-1.5 3.8 1.7-.7 3.2c-.1.6-.7 1-1.3 1A12.5 12.5 0 0 1 1.9 3.6c0-.6.4-1.1 1-1.3l3.2-.7 1.2 1.2Z" />
    ),
    location: (
      <path d="M8 14s4.5-4.1 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.9 8 14 8 14Zm0-5.8a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" />
    ),
    clock: (
      <path d="M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13Zm0-9v3.2l2.2 1.3" />
    ),
    award: (
      <path d="M8 2L10.5 7h5.5L12 10l2.5 5L8 12l-6.5 3 2.5-5-4-3h5.5L8 2Z" />
    ),
    star: (
      <path d="m8 2.2 1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11l-3.5 1.9.7-3.9-2.8-2.7 3.9-.6L8 2.2Z" />
    ),
    search: (
      <path d="m13.5 13.5-3.1-3.1m1-4.1a5.1 5.1 0 1 1-10.2 0 5.1 5.1 0 0 1 10.2 0Z" />
    ),
  };

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="doctors-directory-icon">
      {paths[name]}
    </svg>
  );
}

// SUGGESTION: This component should be extracted to a separate file (e.g., /components/DoctorCardSkeleton.jsx) for better reusability.
const DoctorCardSkeleton = () => (
  <div className="doctor-profile-card" aria-hidden="true">
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .skeleton {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        background-color: #eaf3ff;
        border-radius: 8px;
      }
    `}</style>
    <div className="doctor-profile-header">
      <div className="skeleton" style={{ width: '64px', height: '64px', minWidth: '64px', borderRadius: '12px' }}></div>
      <div className="doctor-profile-info" style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: '20px', width: '70%', marginBottom: '8px' }}></div>
        <div className="skeleton" style={{ height: '16px', width: '50%' }}></div>
      </div>
    </div>
    <div className="doctor-profile-details">
      <div className="skeleton" style={{ height: '40px', width: '90%' }}></div>
    </div>
    <div className="doctor-clinic-info" style={{ flexGrow: 1, padding: '20px 24px' }}>
      <div className="skeleton" style={{ height: '16px', width: '40%', marginBottom: '12px' }}></div>
      <div className="skeleton" style={{ height: '14px', width: '100%', marginBottom: '8px' }}></div>
      <div className="skeleton" style={{ height: '14px', width: '80%' }}></div>
    </div>
    <div style={{ padding: '20px 24px', marginTop: 'auto' }}>
      <div className="skeleton" style={{ height: '45px', width: '100%', borderRadius: '10px' }}></div>
    </div>
  </div>
);

// SUGGESTION: This component should be extracted to a separate file (e.g., /components/DoctorCard.jsx) for better reusability.
const DoctorCard = ({ doctor, onBookAppointment }) => {
  const rating = doctor.rating || 4.8;
  const reviewCount = doctor.reviewCount || 120;

  return (
    <div className="doctor-profile-card">
      <div className="doctor-profile-header">
        {doctor.profileImage ? (
          <img src={doctor.profileImage} alt={doctor.name} className="doctor-profile-avatar image" />
        ) : (
          <div className="doctor-profile-avatar">{doctor.name.charAt(0)}</div>
        )}
        <div className="doctor-profile-info">
          <h3 className="doctor-profile-name">Dr. {doctor.name}</h3>
          <p className="doctor-profile-specialty">{doctor.specialization}</p>
          <div className="doctor-profile-rating">
            <Icon name="star" />
            <span>{rating.toFixed(1)} ({reviewCount}+)</span>
          </div>
        </div>
      </div>

      <div className="doctor-profile-details">
        <div className="doctor-profile-detail-item"><Icon name="award" /><div><span className="detail-label">Experience</span><span className="detail-value">{doctor.experience} years</span></div></div>
        <div className="doctor-profile-detail-item"><Icon name="location" /><div><span className="detail-label">Location</span><span className="detail-value">{doctor.location}</span></div></div>
        <div className="doctor-profile-detail-item"><Icon name="phone" /><div><span className="detail-label">Consultation Fee</span><span className="detail-value">₹{doctor.fees}</span></div></div>
      </div>

      {doctor.detailsSubmitted && doctor.hospitalClinicDetails?.clinicName && (
        <div className="doctor-clinic-info">
          <h4 className="clinic-info-title"><Icon name="hospital" />Clinic/Hospital</h4>
          <div className="clinic-detail"><strong>{doctor.hospitalClinicDetails.clinicName}</strong></div>
          {doctor.hospitalClinicDetails.clinicAddress && <div className="clinic-detail"><Icon name="location" /><span>{doctor.hospitalClinicDetails.clinicAddress}</span></div>}
        </div>
      )}

      <button type="button" className="doctor-profile-btn" onClick={() => onBookAppointment(doctor)}>
        Book Appointment
      </button>
    </div>
  );
};

export default function DoctorsDirectory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [selectedSpecialty, setSelectedSpecialty] = useState(() => searchParams.get("specialty") || "all");
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get("city") || "all");
  const [minExperience, setMinExperience] = useState(() => searchParams.get("minExperience") || "");
  const [maxFees, setMaxFees] = useState(() => searchParams.get("maxFees") || "");

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [specialtiesData, citiesData] = await Promise.all([
          getSpecialties(),
          getCities(),
        ]);
        setSpecialties(["all", ...specialtiesData]);
        setCities(["all", ...citiesData]);
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          search: searchTerm,
          specialty: selectedSpecialty,
          city: selectedCity,
          minExperience,
          maxFees,
        };
        const queryParams = Object.fromEntries(
          Object.entries(params).filter(([, value]) => value && value !== "all")
        );
        const doctorsList = await getDoctors(queryParams);
        setDoctors(doctorsList);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError(err.response?.data?.error || "Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [searchTerm, selectedSpecialty, selectedCity, minExperience, maxFees]);

  const handleBookAppointment = (doctor) => {
    if (!doctor?._id) {
      return;
    }

    sessionStorage.setItem("selectedDoctorId", doctor._id);
    navigate(`/doctors/${doctor._id}`);
  };

  const areFiltersActive = searchTerm || selectedSpecialty !== "all" || selectedCity !== "all" || minExperience || maxFees;

  return (
    <>
      <Navbar />
      <div className="doctors-directory-container">
        <div className="doctors-directory-hero">
          <h1>Find Your Doctor</h1>
          <p>Browse our network of verified healthcare professionals</p>
        </div>
        <div className="doctors-directory-content">
          {/* Filters */}
          <div className="doctors-directory-filters">
            <div className="doctors-directory-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search by name, specialty, or clinic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="doctors-directory-search-input"
              />
            </div>

            <div className="doctors-directory-specialties">
              {specialties.length > 1 ? ( // >1 to account for "all"
                specialties.map((specialty) => (
                  <button
                    key={specialty}
                    className={`doctors-directory-specialty-btn ${
                      selectedSpecialty === specialty ? "active" : ""
                    }`}
                    onClick={() => setSelectedSpecialty(specialty)}
                  >
                    {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                  </button>
                ))
              ) : (
                <p style={{ color: "#999" }}>No specialties available</p>
              )}
            </div>

            <div className="doctors-directory-specialties city-filter-row">
              {cities.length > 1 && cities.map((city) => (
                <button
                  key={city}
                  className={`doctors-directory-specialty-btn ${
                    selectedCity === city ? "active" : ""
                  }`}
                  onClick={() => setSelectedCity(city)}
                  type="button"
                >
                  {city === "all" ? "All Cities" : city}
                </button>
              ))}
            </div>

            <div className="doctors-directory-range-filters">
              <label>
                <span>Experience</span>
                <select value={minExperience} onChange={(event) => setMinExperience(event.target.value)}>
                  <option value="">Any experience</option>
                  <option value="1">1+ years</option>
                  <option value="5">5+ years</option>
                  <option value="10">10+ years</option>
                  <option value="15">15+ years</option>
                </select>
              </label>
              <label>
                <span>Max fees</span>
                <select value={maxFees} onChange={(event) => setMaxFees(event.target.value)}>
                  <option value="">Any fee</option>
                  <option value="500">Up to Rs. 500</option>
                  <option value="1000">Up to Rs. 1000</option>
                  <option value="1500">Up to Rs. 1500</option>
                  <option value="2500">Up to Rs. 2500</option>
                </select>
              </label>
              {areFiltersActive ? (
                <button
                  type="button"
                  className="doctors-directory-clear-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSpecialty("all");
                    setSelectedCity("all");
                    setMinExperience("");
                    setMaxFees("");
                  }}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
          {/* Doctors Grid */}
          {loading ? (
            <div className="doctors-directory-grid">
              {Array.from({ length: 6 }).map((_, index) => <DoctorCardSkeleton key={index} />)}
            </div>
          ) : error ? (
            <div className="doctors-directory-error">❌ Error: {error}</div>
          ) : doctors.length === 0 ? (
            <div className="doctors-directory-empty">
              <Icon name="hospital" />
              {areFiltersActive ? (
                <>
                  <h3>No doctors found</h3>
                  <p>Try adjusting your search criteria</p>
                </>
              ) : (
                <>
                  <h3>No doctors found in database</h3>
                  <p>Doctors will appear here once they complete their signup</p>
                </>
              )}
            </div>
          ) : (
            <div className="doctors-directory-grid">
              {doctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} onBookAppointment={handleBookAppointment} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
