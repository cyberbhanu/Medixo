import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getClinics, getHospitals, getLabs } from "../api";
import "../styles/resources-directory.css";

const CONFIG = {
  facilities: {
    title: "Hospitals & Clinics",
    description: "Compare hospitals, clinics, locations, services, and available doctors.",
    load: async () => {
      const [hospitals, clinics] = await Promise.all([getHospitals(), getClinics()]);
      return [
        ...hospitals.map((item) => ({ ...item, resourceType: "hospitals", resourceLabel: "Hospital" })),
        ...clinics.map((item) => ({ ...item, resourceType: "clinics", resourceLabel: "Clinic" })),
      ];
    },
  },
  labs: {
    title: "Laboratories",
    description: "Find a laboratory, review available tests, and book directly.",
    load: async () => (await getLabs()).map((item) => ({ ...item, resourceType: "labs", resourceLabel: "Laboratory" })),
  },
};

const getLocation = (item) => item.city || item.location || item.address || "Location pending";

function ResourceCard({ item }) {
  const tests = item.availableTests?.map((test) => test.name || test).filter(Boolean) || [];
  const doctors = item.doctors?.length || 0;
  const detailPath = `/${item.resourceType}/${item._id}`;

  return (
    <article className="resources-directory-card">
      <div className="resources-directory-media">
        {item.logo || item.image ? <img src={item.logo || item.image} alt={item.name} loading="lazy" /> : <span>{item.resourceLabel.charAt(0)}</span>}
      </div>
      <div className="resources-directory-body">
        <div className="resources-directory-title-row">
          <div>
            <span className="resources-directory-eyebrow">{item.resourceLabel}</span>
            <h2>{item.name}</h2>
          </div>
          <span className="resources-directory-rating">★ {Number(item.rating || 4.6).toFixed(1)}</span>
        </div>
        <p className="resources-directory-location">{getLocation(item)}</p>
        <div className="resources-directory-meta">
          {item.phone ? <span>{item.phone}</span> : null}
          {item.email ? <span>{item.email}</span> : null}
          {item.resourceType === "labs" ? <span>{tests.length} tests listed</span> : <span>{doctors} doctors</span>}
        </div>
        {item.resourceType === "labs" && tests.length ? (
          <div className="resources-directory-tags">{tests.slice(0, 4).map((test) => <span key={test}>{test}</span>)}</div>
        ) : null}
        <div className="resources-directory-actions">
          <Link to={detailPath} className="resources-directory-primary">View details</Link>
          {item.resourceType === "labs" ? <Link to={`${detailPath}/book`} className="resources-directory-secondary">Book a test</Link> : <Link to={detailPath} className="resources-directory-secondary">View doctors</Link>}
        </div>
      </div>
    </article>
  );
}

export default function ResourcesDirectory({ resourceType = "facilities" }) {
  const navigate = useNavigate();
  const config = CONFIG[resourceType] || CONFIG.facilities;
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    config.load()
      .then((items) => { if (active) setResources(Array.isArray(items) ? items : []); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.error || `Unable to load ${config.title.toLowerCase()}.`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [config]);

  const filteredResources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return resources;
    return resources.filter((item) => [item.name, item.city, item.location, item.address, item.email, item.phone, ...(item.availableTests || []).map((test) => test.name || test)]
      .some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [query, resources]);

  return (
    <>
      <Navbar />
      <main className="resources-directory-page">
        <div className="resources-directory-shell">
          <button type="button" className="resources-directory-back" onClick={() => navigate(-1)}>Back</button>
          <header className="resources-directory-header">
            <span>Medixo directory</span>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </header>
          <label className="resources-directory-search">
            <span>Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()} by name or city`} />
          </label>
          {loading ? <div className="resources-directory-state">Loading {config.title.toLowerCase()}...</div> : null}
          {error ? <div className="resources-directory-state error">{error}</div> : null}
          {!loading && !error ? (
            filteredResources.length ? <div className="resources-directory-grid">{filteredResources.map((item) => <ResourceCard key={`${item.resourceType}-${item._id}`} item={item} />)}</div>
              : <div className="resources-directory-state">No matching {config.title.toLowerCase()} found.</div>
          ) : null}
        </div>
      </main>
    </>
  );
}
