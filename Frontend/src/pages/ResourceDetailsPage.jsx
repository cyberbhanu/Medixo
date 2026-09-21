import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getClinicById, getHospitalById, getLabById } from "../api";
import "../styles/resource-details.css";

const RESOURCE_CONFIG = {
  hospitals: { label: "Hospital", load: getHospitalById },
  clinics: { label: "Clinic", load: getClinicById },
  labs: { label: "Laboratory", load: getLabById },
};

export default function ResourceDetailsPage({ resourceType }) {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const config = RESOURCE_CONFIG[resourceType];
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!config) {
      setError("Resource not found");
      setLoading(false);
      return undefined;
    }

    config.load(resourceId)
      .then((data) => {
        if (active) setResource(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.error || `Unable to load ${config.label.toLowerCase()} details`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [config, resourceId]);

  const doctors = resource?.doctors || [];
  const tests = resource?.availableTests || [];

  return (
    <>
      <Navbar />
      <main className="resource-details-page">
        <div className="resource-details-shell">
          <button type="button" className="resource-back-button" onClick={() => navigate(-1)}>Back</button>
          {loading ? <p className="resource-details-state">Loading {config?.label.toLowerCase() || "resource"} details...</p> : null}
          {error ? <div className="resource-details-error">{error}</div> : null}
          {resource ? (
            <>
              <header className="resource-details-header">
                <div className="resource-details-logo">
                  {resource.logo || resource.image ? <img src={resource.logo || resource.image} alt={resource.name} /> : <span>{config.label.charAt(0)}</span>}
                </div>
                <div>
                  <span className="resource-details-eyebrow">{config.label}</span>
                  <h1>{resource.name}</h1>
                  <p>{resource.address || resource.location || "Location details will be updated soon."}</p>
                </div>
              </header>
              <div className="resource-details-grid">
                <section className="resource-details-panel">
                  <h2>At a glance</h2>
                  <div className="resource-detail-list">
                    <div><span>Location</span><strong>{resource.city || resource.location || "Not listed"}</strong></div>
                    <div><span>Phone</span><strong>{resource.phone || "Not listed"}</strong></div>
                    <div><span>Email</span><strong>{resource.email || "Not listed"}</strong></div>
                    {resource.openingHours ? <div><span>Hours</span><strong>{resource.openingHours}</strong></div> : null}
                  </div>
                </section>
                <section className="resource-details-panel">
                  <h2>{resourceType === "labs" ? "Available tests" : "Care network"}</h2>
                  {resourceType === "labs" ? (
                    tests.length ? <ul className="resource-details-list">{tests.map((test) => <li key={test.name}>{test.name}{test.price ? ` - Rs. ${test.price}` : ""}</li>)}</ul> : <p className="resource-details-muted">Test catalogue will be updated by the laboratory.</p>
                  ) : (
                    doctors.length ? <ul className="resource-details-list">{doctors.map((doctor) => (
                      <li key={doctor._id}>
                        <div>
                          <strong>Dr. {doctor.name}</strong>
                          <span>{doctor.specialization}</span>
                        </div>
                        <Link to={`/doctors/${doctor._id}`} className="resource-inline-action">Book appointment</Link>
                      </li>
                    ))}</ul> : <p className="resource-details-muted">Provider details will be updated soon.</p>
                  )}
                </section>
              </div>
              <div className="resource-details-actions">
                {resourceType === "labs" ? <Link to={`/labs/${resource._id}/book`} className="resource-primary-action">Book a test</Link> : <Link to={`/doctors?search=${encodeURIComponent(resource.name)}`} className="resource-primary-action">Find doctors here</Link>}
                {resourceType === "labs" ? <Link to="/lab-login" className="resource-secondary-action">Laboratory login</Link> : <Link to="/doctors" className="resource-secondary-action">Browse all doctors</Link>}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
