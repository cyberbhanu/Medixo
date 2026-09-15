import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";
import { getDashboardPath, normalizeRole, setStoredAuth } from "../utils/auth";
import Navbar from "./Navbar";
import "../styles/auth.css";

export default function LaboratoryLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(formData);
      if (normalizeRole(data.user.role) !== "laboratory") {
        setError("Please use the laboratory login for a laboratory account.");
        return;
      }

      setStoredAuth(data.token, data.user);
      navigate(getDashboardPath(data.user.role));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to sign in to the laboratory workspace");
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
              <h1 className="auth-title">Laboratory Login</h1>
              <p className="auth-subtitle">Manage referred tests and upload patient reports</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              {error ? <div className="auth-error">{error}</div> : null}
              <div className="form-group">
                <label className="form-label" htmlFor="lab-email">Laboratory email</label>
                <input id="lab-email" type="email" name="email" placeholder="lab@medixo.com" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="lab-password">Password</label>
                <input id="lab-password" type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className="form-input" required />
              </div>
              <button type="submit" disabled={loading} className="auth-button auth-button-primary">
                {loading ? "Signing in..." : "Sign in to laboratory"}
              </button>
            </form>
            <div className="auth-footer">
              <p className="auth-footer-text">Laboratory accounts are created by an administrator.</p>
              <p className="auth-footer-text"><Link to="/login" className="auth-link">Patient login</Link></p>
            </div>
          </div>
          <div className="auth-image">
            <div className="auth-image-content">
              <h2>Keep every referral moving</h2>
              <p>Receive assigned tests from doctors and staff, update their status, and share reports with the care team.</p>
              <ul className="auth-features">
                <li>View only your laboratory bookings</li>
                <li>Accept or reject referrals</li>
                <li>Upload report links</li>
                <li>Close completed tests securely</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
