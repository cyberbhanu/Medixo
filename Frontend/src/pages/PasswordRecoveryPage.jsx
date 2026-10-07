import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { requestPasswordReset, resetPassword } from "../api";
import "../styles/auth.css";

export default function PasswordRecoveryPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRequest = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to request a password reset.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      setPassword("");
      setConfirmation("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="auth-container">
        <div className="auth-wrapper">
          <section className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">{token ? "Set a new password" : "Forgot password?"}</h1>
              <p className="auth-subtitle">{token ? "Choose a new password for your Medixo account." : "Enter your email and we will send you a secure reset link."}</p>
            </div>
            <form className="auth-form" onSubmit={token ? submitReset : submitRequest}>
              {error && <div className="auth-error">{error}</div>}
              {message && <div className="auth-success">{message}</div>}
              {!token ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-email">Email address</label>
                  <input id="reset-email" className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-password">New password</label>
                    <input id="new-password" className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">Confirm password</label>
                    <input id="confirm-password" className="form-input" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={6} required autoComplete="new-password" />
                  </div>
                </>
              )}
              <button className="auth-button auth-button-primary" type="submit" disabled={loading}>{loading ? "Please wait..." : token ? "Update password" : "Send reset link"}</button>
            </form>
            <div className="auth-footer"><Link to="/login" className="auth-link">Back to login</Link></div>
          </section>
          <div className="auth-image"><div className="auth-image-content"><h2>Secure account recovery</h2><p>One-time reset links help keep every Medixo account protected.</p></div></div>
        </div>
      </main>
    </>
  );
}
