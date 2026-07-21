import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, updateDoctorHospitalDetails, getDoctors } from "../api";
import { setStoredAuth, getDashboardPath } from "../utils/auth";
import Navbar from "./Navbar";
import EditClinicDetailsModal from "./EditClinicDetailsModal";
import "../styles/auth.css";

const DoctorLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHospitalDetails, setShowHospitalDetails] = useState(false);
  const [loginData, setLoginData] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login({ ...formData, role: "doctor" });

      // After login, we need the full doctor profile to check for details and get the correct ID
      const doctorProfiles = await getDoctors({ userId: data.user.id, email: data.user.email });
      if (!doctorProfiles.length) {
        setError("Doctor profile not found for this user account. Please contact an admin.");
        setLoading(false);
        return;
      }
      const doctorProfile = doctorProfiles[0];

      // Check if doctor has already submitted hospital details
      if (doctorProfile.detailsSubmitted) {
        setStoredAuth(data.token, data.user);
        alert("Login successful");
        navigate(getDashboardPath(data.user?.role));
      } else {
        // Show hospital details form
        setLoginData({ ...data, doctorProfile });
        setShowHospitalDetails(true);
      }
    } catch (error) {
      setError(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (showHospitalDetails && loginData) {
    return (
      <>
        <Navbar />
        <EditClinicDetailsModal
          doctorProfile={{}}
          user={loginData?.user}
          onClose={() => setShowHospitalDetails(false)}
          onSave={async (updatedDetails) => {
            await updateDoctorHospitalDetails(
              loginData.doctorProfile._id,
              updatedDetails,
              loginData.token
            );
            // After successful submission, complete the login
            setStoredAuth(loginData.token, { ...loginData.user, detailsSubmitted: true });
            alert("Login successful! Hospital details saved.");
            navigate(getDashboardPath(loginData.user?.role));
          }}
        />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Doctor Login</h1>
              <p className="auth-subtitle">Access your Medixo doctor account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-button auth-button-primary"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="auth-divider">OR</div>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{" "}
                <Link to="/signup" className="auth-link">
                  Create one now
                </Link>
              </p>
              <p className="auth-footer-text">
                Patient login?{" "}
                <Link to="/login" className="auth-link">
                  Click here
                </Link>
              </p>
            </div>
          </div>

          <div className="auth-image">
            <div className="auth-image-content">
              <h2>Manage Your Practice</h2>
              <p>Add and manage your hospital/clinic details with ease</p>
              <ul className="auth-features">
                <li>✓ Add multiple hospital/clinic details</li>
                <li>✓ Manage your availability</li>
                <li>✓ Track patient appointments</li>
                <li>✓ Update your services</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorLogin;
