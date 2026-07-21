import { useState } from "react";
import { uploadClinicImage } from "../api";
import "../styles/modal.css";

const EditClinicDetailsModal = ({ doctorProfile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    hospitalName: doctorProfile?.hospitalClinicDetails?.hospitalName || "",
    clinicName: doctorProfile?.hospitalClinicDetails?.clinicName || "",
    clinicImage: doctorProfile?.hospitalClinicDetails?.clinicImage || "",
    clinicAddress: doctorProfile?.hospitalClinicDetails?.clinicAddress || "",
    phoneNumber: doctorProfile?.hospitalClinicDetails?.phoneNumber || "",
    licenseNumber: doctorProfile?.hospitalClinicDetails?.licenseNumber || "",
    registrationNumber: doctorProfile?.hospitalClinicDetails?.registrationNumber || "",
    timings: doctorProfile?.hospitalClinicDetails?.timings || "",
    services: doctorProfile?.hospitalClinicDetails?.services || [],
  });

  const [serviceInput, setServiceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleAddService = () => {
    if (serviceInput.trim()) {
      setFormData({
        ...formData,
        services: [...formData.services, serviceInput.trim()],
      });
      setServiceInput("");
    }
  };

  const handleRemoveService = (index) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddService();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    setError("");
    try {
      const data = await uploadClinicImage(file);
      setFormData((prev) => ({ ...prev, clinicImage: data.imageUrl }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.clinicName && !formData.hospitalName) {
        setError("Please provide at least a clinic or hospital name");
        setLoading(false);
        return;
      }

      if (!formData.clinicAddress) {
        setError("Please provide a clinic address");
        setLoading(false);
        return;
      }

      if (!formData.phoneNumber) {
        setError("Please provide a phone number");
        setLoading(false);
        return;
      }

      await onSave(formData);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to save hospital details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            Edit Hospital/Clinic Details
          </h2>
          <button onClick={onClose} className="modal-close-btn" type="button">
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-form-group">
            <label className="modal-label">Hospital Name (Optional)</label>
            <input
              type="text"
              name="hospitalName"
              placeholder="e.g., City Medical Hospital"
              value={formData.hospitalName}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Clinic Name (Optional)</label>
            <input
              type="text"
              name="clinicName"
              placeholder="e.g., Dr. Smith's Clinic"
              value={formData.clinicName}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Clinic Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="modal-input"
              disabled={imageUploading}
            />
            {imageUploading && <p className="image-upload-status">Uploading image...</p>}
            {formData.clinicImage && (
              <div className="image-preview-container">
                <img 
                  src={formData.clinicImage} 
                  alt="Preview" 
                  className="image-preview"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/600x160?text=Invalid+Image+URL'; }} 
                />
              </div>
            )}
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Clinic/Hospital Address *</label>
            <textarea
              name="clinicAddress"
              placeholder="Enter full address"
              value={formData.clinicAddress}
              onChange={handleChange}
              className="modal-input"
              rows="3"
              required
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="e.g., +1 (555) 123-4567"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="modal-input"
              required
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">License Number</label>
            <input
              type="text"
              name="licenseNumber"
              placeholder="Medical license number"
              value={formData.licenseNumber}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Registration Number</label>
            <input
              type="text"
              name="registrationNumber"
              placeholder="Medical registration number"
              value={formData.registrationNumber}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Clinic Timings</label>
            <input
              type="text"
              name="timings"
              placeholder="e.g., Mon-Fri 9:00 AM - 6:00 PM"
              value={formData.timings}
              onChange={handleChange}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Services Offered</label>
            <div className="service-input-container">
              <input
                type="text"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a service and press Enter"
                className="modal-input service-input"
              />
              <button
                type="button"
                onClick={handleAddService}
                className="add-service-btn"
              >
                Add
              </button>
            </div>

            {formData.services.length > 0 && (
              <div className="services-container">
                {formData.services.map((service, index) => (
                  <div key={index} className="service-tag">
                    {service}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(index)}
                      className="remove-service-btn"
                      aria-label={`Remove ${service}`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              onClick={onClose}
              className="modal-cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="modal-submit-btn">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditClinicDetailsModal;
