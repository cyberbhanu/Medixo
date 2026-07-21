import "../styles/clinic-card.css";

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
    edit: (
      <path d="m3 12.5.8-3.5L12 2l2.5 2.5-7 8.5-3.5.5Z" />
    ),
  };

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="clinic-card-icon">
      {paths[name]}
    </svg>
  );
}

const ClinicDetailsCard = ({ doctorProfile, onEdit }) => {
  const details = doctorProfile?.hospitalClinicDetails || {};
  const hasDetails = doctorProfile?.detailsSubmitted;

  if (!hasDetails) {
    return (
      <div className="clinic-card-placeholder">
        <div className="clinic-card-placeholder-content">
          <Icon name="hospital" />
          <h3>Hospital/Clinic Details Not Added</h3>
          <p>Add your hospital or clinic information to help patients find you easily</p>
          {onEdit && (
            <button className="clinic-card-btn-primary" onClick={onEdit}>
              Add Details Now
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-details-container">
      <div className="clinic-card-header">
        <h2 className="clinic-card-title">
          <Icon name="hospital" />
          Hospital/Clinic Information
        </h2>
        {onEdit && (
          <button className="clinic-card-btn-icon" onClick={onEdit} title="Edit details">
            <Icon name="edit" />
          </button>
        )}
      </div>

      {details.clinicImage && (
        <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #e3f0ff', backgroundColor: '#f8fafd' }}>
          <img src={details.clinicImage} alt="Clinic Facility" style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', display: 'block' }} onError={(e) => e.target.style.display = 'none'} />
        </div>
      )}

      <div className="clinic-cards-grid">
        {/* Hospital/Clinic Name Card */}
        {(details.hospitalName || details.clinicName) && (
          <div className="clinic-info-card">
            <div className="clinic-info-header">
              <Icon name="hospital" />
              <span className="clinic-info-label">Facility Name</span>
            </div>
            <div className="clinic-info-content">
              <p className="clinic-info-main">
                {details.clinicName || details.hospitalName}
              </p>
              {details.clinicName && details.hospitalName && (
                <p className="clinic-info-sub">{details.hospitalName}</p>
              )}
            </div>
          </div>
        )}

        {/* Address Card */}
        {details.clinicAddress && (
          <div className="clinic-info-card">
            <div className="clinic-info-header">
              <Icon name="location" />
              <span className="clinic-info-label">Address</span>
            </div>
            <div className="clinic-info-content">
              <p className="clinic-info-main">{details.clinicAddress}</p>
            </div>
          </div>
        )}

        {/* Phone Card */}
        {details.phoneNumber && (
          <div className="clinic-info-card">
            <div className="clinic-info-header">
              <Icon name="phone" />
              <span className="clinic-info-label">Contact</span>
            </div>
            <div className="clinic-info-content">
              <p className="clinic-info-main">
                <a href={`tel:${details.phoneNumber}`} className="clinic-info-link">
                  {details.phoneNumber}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Timings Card */}
        {details.timings && (
          <div className="clinic-info-card">
            <div className="clinic-info-header">
              <Icon name="clock" />
              <span className="clinic-info-label">Clinic Timings</span>
            </div>
            <div className="clinic-info-content">
              <p className="clinic-info-main">{details.timings}</p>
            </div>
          </div>
        )}

        {/* Licenses Card */}
        {(details.licenseNumber || details.registrationNumber) && (
          <div className="clinic-info-card">
            <div className="clinic-info-header">
              <Icon name="award" />
              <span className="clinic-info-label">Professional Details</span>
            </div>
            <div className="clinic-info-content">
              {details.licenseNumber && (
                <p className="clinic-info-item">
                  <span className="clinic-info-item-label">License:</span>
                  <span className="clinic-info-item-value">{details.licenseNumber}</span>
                </p>
              )}
              {details.registrationNumber && (
                <p className="clinic-info-item">
                  <span className="clinic-info-item-label">Registration:</span>
                  <span className="clinic-info-item-value">{details.registrationNumber}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Services Section */}
      {details.services && details.services.length > 0 && (
        <div className="clinic-services-section">
          <h3 className="clinic-services-title">Services Offered</h3>
          <div className="clinic-services-grid">
            {details.services.map((service, index) => (
              <div key={index} className="clinic-service-tag">
                {service}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Details View Toggle */}
      {(details.licenseNumber ||
        details.registrationNumber ||
        details.timings ||
        (details.services && details.services.length > 0)) && (
        <div className="clinic-full-details">
          <div className="clinic-details-summary">
            <ul className="clinic-details-list">
              {details.hospitalName && (
                <li>
                  <strong>Hospital:</strong> {details.hospitalName}
                </li>
              )}
              {details.clinicName && (
                <li>
                  <strong>Clinic:</strong> {details.clinicName}
                </li>
              )}
              {details.clinicAddress && (
                <li>
                  <strong>Address:</strong> {details.clinicAddress}
                </li>
              )}
              {details.phoneNumber && (
                <li>
                  <strong>Phone:</strong>{" "}
                  <a href={`tel:${details.phoneNumber}`} className="clinic-info-link">
                    {details.phoneNumber}
                  </a>
                </li>
              )}
              {details.licenseNumber && (
                <li>
                  <strong>License No:</strong> {details.licenseNumber}
                </li>
              )}
              {details.registrationNumber && (
                <li>
                  <strong>Registration No:</strong> {details.registrationNumber}
                </li>
              )}
              {details.timings && (
                <li>
                  <strong>Timings:</strong> {details.timings}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicDetailsCard;
