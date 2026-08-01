import Navbar from "../components/Navbar";
import "../styles/legal.css";

const pageContent = {
  privacy: {
    title: "Privacy Policy",
    intro: "Medixo respects patient, doctor, clinic, and laboratory information shared through the platform.",
    sections: [
      {
        title: "Information We Collect",
        text: "We collect account details, appointment information, contact details, and healthcare listing data needed to support booking and directory services.",
      },
      {
        title: "How We Use Information",
        text: "We use information to show relevant doctors, manage appointments, improve service quality, and communicate booking updates.",
      },
      {
        title: "Data Protection",
        text: "We use reasonable safeguards to protect user data and limit access to authorized users based on their role.",
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "By using Medixo, users agree to use the platform responsibly for healthcare discovery and appointment booking.",
    sections: [
      {
        title: "Platform Use",
        text: "Patients may search doctors and request appointments. Doctors, admins, and laboratories are responsible for keeping their listed details accurate.",
      },
      {
        title: "Medical Responsibility",
        text: "Medixo helps users connect with healthcare providers, but clinical advice, diagnosis, and treatment remain the responsibility of qualified professionals.",
      },
      {
        title: "Appointments",
        text: "Appointment requests may require confirmation, rescheduling, or cancellation depending on provider availability.",
      },
    ],
  },
};

export default function LegalPage({ type }) {
  const content = pageContent[type] || pageContent.privacy;

  return (
    <main className="legal-page">
      <Navbar />
      <section className="legal-hero">
        <div className="legal-shell">
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </section>
      <section className="legal-shell legal-content">
        {content.sections.map((section) => (
          <article className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
