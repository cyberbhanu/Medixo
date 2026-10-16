import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import { getDashboardPath, normalizeRole, setStoredAuth } from "../utils/auth";
import Navbar from "./Navbar";
import "../styles/auth.css";

const Login = ({ adminOnly = false }) => {
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
      if (adminOnly && normalizeRole(data.user?.role) !== "super_admin") {
        setError("Admin credentials are required for this login page.");
        return;
      }
      setStoredAuth(data.token, data.user);
      alert("Login successful");
      const dashboardPath = getDashboardPath(data.user?.role);
      navigate(
        normalizeRole(data.user?.role) === "patient"
          ? `${dashboardPath}#patient-dashboard-home`
          : dashboardPath
      );
    } catch (error) {
      setError(error.response?.data?.error || "Login failed");
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
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">{adminOnly ? "Sign in to the Medixo administration portal" : "Sign in to your Medixo account"}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error">{error}</div>}
              
              <div className="form-group">
                <label className="form-label">{adminOnly ? "Admin email" : "Email or Patient ID"}</label>
                <input
                  type="text"
                  name="email"
                  placeholder={adminOnly ? "admin@medixohealthcare.com" : "Enter email or Patient ID"}
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

              {!adminOnly ? (
                <div className="auth-form-help">
                  <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="auth-button auth-button-primary"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {!adminOnly ? (
              <>
                <div className="auth-divider">OR</div>
                <div className="auth-footer">
                  <p className="auth-footer-text">
                    Don't have an account?{" "}
                    <Link to="/signup" className="auth-link">Create one now</Link>
                  </p>
                </div>
              </>
            ) : (
              <div className="auth-footer"><p className="auth-footer-text">Authorized Medixo administrators only.</p></div>
            )}
          </div>

          <div className="auth-image">
            <div className="auth-image-content">
              <h2>Welcome to Medixo</h2>
              <p>Your complete healthcare management platform</p>
              <ul className="auth-features">
                <li>✓ Verified healthcare professionals</li>
                <li>✓ Instant appointment booking</li>
                <li>✓ Secure payment options</li>
                <li>✓ 24/7 customer support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
