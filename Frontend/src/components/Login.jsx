import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import { getDashboardPath, setStoredAuth } from "../utils/auth";
import Navbar from "./Navbar";
import "../styles/auth.css";

const Login = () => {
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
      setStoredAuth(data.token, data.user);
      alert("Login successful");
      navigate(getDashboardPath(data.user?.role));
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
              <p className="auth-subtitle">Sign in to your Medixo account</p>
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
            </div>
          </div>

          <div className="auth-image">
            <div className="auth-image-content">
              <h2>Quality Healthcare Made Easy</h2>
              <p>Connect with verified doctors and book appointments in minutes</p>
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
