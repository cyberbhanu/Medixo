import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api";
import Navbar from "./Navbar";
import "../styles/auth.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    specialization: "",
    experience: "",
    location: "",
    fees: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isDoctor = false;

  const handleChange = (e) => {
    const nextFormData = { ...formData, [e.target.name]: e.target.value };

    if (e.target.name === "role" && e.target.value !== "doctor") {
      nextFormData.specialization = "";
      nextFormData.experience = "";
      nextFormData.location = "";
      nextFormData.fees = "";
    }

    setFormData(nextFormData);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(formData);
      alert("Signup successful! Please login to continue");
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join Medixo to book appointments with verified doctors</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error">{error}</div>}
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Type</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                  disabled
                >
                  <option value="patient">Patient</option>
                </select>
              </div>

              {isDoctor ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      placeholder="Cardiology"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="form-input"
                      required={isDoctor}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      name="experience"
                      placeholder="10"
                      value={formData.experience}
                      onChange={handleChange}
                      className="form-input"
                      required={isDoctor}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Delhi"
                      value={formData.location}
                      onChange={handleChange}
                      className="form-input"
                      required={isDoctor}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consultation Fee</label>
                    <input
                      type="number"
                      min="0"
                      name="fees"
                      placeholder="800"
                      value={formData.fees}
                      onChange={handleChange}
                      className="form-input"
                      required={isDoctor}
                    />
                  </div>
                </>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="auth-button auth-button-success"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="auth-divider">OR</div>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="auth-image">
            <div className="auth-image-content">
              <h2>Join Our Healthcare Community</h2>
              <p>Get access to quality healthcare services at your fingertips</p>
              <ul className="auth-features">
                <li>✓ Find verified doctors in your area</li>
                <li>✓ Book appointments instantly</li>
                <li>✓ Secure your medical records</li>
                <li>✓ Affordable healthcare solutions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
