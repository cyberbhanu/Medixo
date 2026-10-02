import { Link } from "react-router-dom";
import "../styles/legal.css";

const content = {
  about: {
    eyebrow: "About Medixo",
    title: "One clear place for everyday healthcare decisions.",
    description: "Medixo connects patients with doctors, clinics, hospitals, and laboratories through a simple healthcare directory and appointment experience.",
    sections: [
      {
        title: "Healthcare made easier",
        body: "Patients can discover providers by city, specialty, availability, and service. Medixo helps people compare useful details before requesting an appointment.",
      },
      {
        title: "Built for connected care",
        body: "Doctors, staff, laboratories, clinics, hospitals, and administrators get tools to manage appointments, queues, referrals, and patient care operations in one place.",
      },
      {
        title: "Our focus",
        body: "We aim to make everyday healthcare access more organized, transparent, and convenient for patients and care teams.",
      },
    ],
  },
  contact: {
    eyebrow: "Contact Medixo",
    title: "We are here to help with your healthcare journey.",
    description: "Contact the Medixo support team for help with appointments, provider information, laboratory bookings, or account questions.",
    sections: [
      {
        title: "Phone support",
        body: "Call us at +91 9473361594 for assistance with the Medixo platform and appointment services.",
      },
      {
        title: "Email support",
        body: "Send your question to support@medixo.com and our team will review your request.",
      },
      {
        title: "Find care",
        body: "You can browse doctors, hospitals, clinics, and laboratories directly from Medixo.",
        links: [
          { label: "Browse doctors", to: "/doctors" },
          { label: "Browse hospitals", to: "/hospitals" },
          { label: "Browse laboratories", to: "/labs" },
        ],
      },
    ],
  },
};

export default function SeoPage({ type }) {
  const page = content[type] || content.about;

  return (
    <main className="legal-page seo-page">
      <section className="legal-hero">
        <div className="legal-shell">
          <p className="legal-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </section>
      <section className="legal-shell legal-content">
        {page.sections.map((section) => (
          <article className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.links ? (
              <div className="seo-page-links">
                {section.links.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
