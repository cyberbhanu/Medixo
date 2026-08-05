import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import { getDashboardPath, normalizeRole, setStoredAuth } from "../utils/auth";
import Navbar from "./Navbar";
import "../styles/auth.css";

const StaffLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(formData);
      if (normalizeRole(data.user.role) !== "staff") {
        setError("Please use the staff login only for staff accounts.");
        setLoading(false);
        return;
      }

      setStoredAuth(data.token, data.user);
      alert("Login successful");
      navigate(getDashboardPath(data.user?.role));
    } catch (error) {
      setError(error.response?.data?.error || "Login failed");
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
              <h1 className="auth-title">Staff Login</h1>
              <p className="auth-subtitle">Sign in to your Medixo staff account</p>
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
                Need a patient account?{" "}
                <Link to="/login" className="auth-link">
                  Patient Login
                </Link>
              </p>
              <p className="auth-footer-text">
                Don't have staff access? Ask admin to create a staff login.
              </p>
            </div>
          </div>

          <div className="auth-image">
            <div className="auth-image-content">
              <h2>Manage Appointments with Confidence</h2>
              <p>Update appointment details, track patient status, and generate patient PDFs instantly.</p>
              <ul className="auth-features">
                <li>✓ View all scheduled appointments</li>
                <li>✓ Update status and care notes</li>
                <li>✓ Download patient appointment PDFs</li>
                <li>✓ Support doctors and patients seamlessly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffLogin;
