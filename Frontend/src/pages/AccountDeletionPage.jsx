import { useState } from "react";
import Navbar from "../components/Navbar";
import { requestAccountDeletion } from "../api";
import "../styles/legal.css";

export default function AccountDeletionPage() {
  const [form, setForm] = useState({ email: "", reason: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await requestAccountDeletion(form.email, form.reason);
      setStatus({ type: "success", message: result.message });
      setForm({ email: "", reason: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.error || "Unable to submit the deletion request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="legal-page">
      <Navbar />
      <section className="legal-hero">
        <div className="legal-shell">
          <p className="legal-eyebrow">Account control</p>
          <h1>Delete your Medixo account</h1>
          <p>Use this page if you cannot sign in to request deletion of your Medixo account and account-linked personal information.</p>
        </div>
      </section>
      <section className="legal-shell legal-content">
        <article className="legal-section account-deletion-card">
          <h2>Submit a deletion request</h2>
          <p>We may contact you to verify ownership before processing the request. Appointment records that must be retained by a provider or by law may be anonymized instead of removed.</p>
          <form className="account-deletion-form" onSubmit={handleSubmit}>
            <label>
              <span>Email address</span>
              <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              <span>Reason (optional)</span>
              <textarea rows="4" maxLength="1000" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            </label>
            {status.message ? <p className={`account-deletion-status ${status.type}`}>{status.message}</p> : null}
            <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Request account deletion"}</button>
          </form>
          <p className="account-deletion-help">You can also contact <a href="mailto:support@medixo.com">support@medixo.com</a>.</p>
        </article>
      </section>
    </main>
  );
}
