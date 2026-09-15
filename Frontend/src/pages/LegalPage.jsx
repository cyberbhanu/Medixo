import Navbar from "../components/Navbar";
import "../styles/legal.css";

const EFFECTIVE_DATE = "September 15, 2026";

const pageContent = {
  privacy: {
    title: "Privacy Policy",
    deletionLink: true,
    intro: "This Privacy Policy explains how Medixo collects, uses, shares, and protects information when you use our website or Android application for healthcare discovery, appointment booking, queue management, and related clinic operations.",
    sections: [
      { title: "Who This Policy Applies To", text: "This policy applies to patients, guests who make an appointment, doctors, clinic and hospital staff, laboratory users, and administrators who use Medixo. It covers information submitted through the website, the Android application, and our appointment and notification services." },
      { title: "Information We Collect", bullets: [
        "Account information such as name, email address, phone number, password, role, and patient account identifier.",
        "Appointment information such as patient name, age, phone number, gender, address, appointment date and time, doctor or laboratory, reason for visit, queue number, and booking credentials.",
        "Healthcare information entered by an authorized patient, doctor, or staff member for an appointment or prescription record, such as weight, blood pressure, clinical notes, and prescription details.",
        "Provider and staff information such as professional profile, specialization, clinic assignment, work contact details, and availability.",
        "Notification information such as browser push subscription details, device or browser information, notification status, and notification history when you enable notifications.",
        "Technical information needed to operate and secure the service, such as log information, browser or device type, and approximate service usage information.",
      ] },
      { title: "How We Use Information", bullets: [
        "Create and secure accounts and authenticate users according to their role.",
        "Display doctors, clinics, hospitals, laboratories, and available services.",
        "Create, confirm, reschedule, cancel, and manage appointments and queues.",
        "Provide appointment information to the selected doctor and the staff assigned by the administrator to that doctor or clinic.",
        "Prepare and display prescription or visit documents requested by an authorized doctor or staff member.",
        "Send appointment, queue, status, and schedule notifications when notification permission is enabled.",
        "Prevent abuse, troubleshoot problems, maintain service security, and comply with legal obligations.",
      ] },
      { title: "How Information Is Shared", text: "We share appointment and related patient information with the healthcare provider selected for that appointment and with authorized staff assigned to that provider or clinic. Administrators may access information needed to manage the Medixo service. We may use hosting, database, security, notification, and infrastructure providers to operate Medixo under appropriate contractual or technical safeguards. We do not sell personal or health information. We may disclose information when required by law, to protect users and the service, or with your direction." },
      { title: "Health and Sensitive Information", text: "Some information entered into Medixo may be personal or health-related. We use it only for the appointment, clinic-operation, prescription, notification, and support purposes described in this policy. Please do not enter information that is not needed for your appointment. Access is role-based, but no online service can guarantee absolute security." },
      { title: "Notifications", text: "Medixo may ask for permission to send browser or app notifications. Notifications can include appointment, queue, schedule, and status information. You can disable notifications in your device or browser settings. A push subscription may be stored so that enabled notifications can be delivered to your device." },
      { title: "Guest Bookings and Booking Credentials", text: "A guest may book without creating an account. Medixo provides a booking reference and password so the guest can access that booking. Keep those credentials private. Anyone who has them may be able to view or manage the booking within the features provided." },
      { title: "Retention and Deletion", text: "We retain information for as long as needed to provide the service, maintain appointment and clinical records, resolve disputes, meet legal or accounting requirements, and protect the service. You may request deletion of an account and associated personal information by emailing support@medixo.com with the subject “Delete my Medixo account”. We may retain information that is legally required, needed for legitimate safety or dispute purposes, or that has been de-identified. Some appointment records may also be retained by the healthcare provider under applicable record-keeping requirements." },
      { title: "Security", text: "We use reasonable administrative, technical, and organizational safeguards, including authenticated access, role-based permissions, password protection, and encrypted connections where supported. You are responsible for protecting your password, booking credentials, and device. Contact us promptly if you believe an account or booking has been accessed without permission." },
      { title: "Children's Privacy", text: "Medixo is not directed to children under 13, and we do not knowingly collect personal information directly from children under 13. A parent or legal guardian should make and manage an appointment for a minor and should provide only the information needed for care." },
      { title: "Your Choices and Requests", text: "You may review or correct information through the available account, booking, or provider workflows, disable notifications through device or browser settings, and request account deletion by contacting support@medixo.com. We may need to verify your identity before completing a request." },
      { title: "Changes and Contact", text: "We may update this policy when the service or legal requirements change. The revised version will be posted on this page with a new effective date. For privacy questions or requests, contact support@medixo.com." },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "These Terms & Conditions govern your use of Medixo for finding healthcare providers, booking appointments, managing queues, receiving notifications, and supporting clinic operations.",
    sections: [
      { title: "Acceptance and Eligibility", text: "By using Medixo, you agree to these Terms and our Privacy Policy. If you use Medixo for a child or another person, you confirm that you are authorized to do so. Minors should use the service with a parent or legal guardian." },
      { title: "What Medixo Provides", text: "Medixo is a healthcare discovery, appointment, queue, notification, and clinic-operations platform. We help users connect with providers and manage information supplied by users and providers. Availability, fees, schedules, clinic details, and appointment confirmation may change." },
      { title: "Medical Disclaimer", text: "Medixo is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Medixo does not replace professional medical advice, diagnosis, or treatment. Doctors and other healthcare providers are independent professionals responsible for their clinical decisions and the accuracy of their medical advice. Seek urgent medical care for emergencies." },
      { title: "Appointments and Queue Numbers", bullets: [
        "An appointment request is not necessarily confirmed until the provider or authorized staff confirms it.",
        "Queue numbers generally reflect the provider's queue for the relevant date and may change when appointments are cancelled, rescheduled, completed, or handled as walk-ins.",
        "The appointment time is an expected schedule and not a guarantee that a consultation will begin at that exact time.",
        "Patients should check appointment status, arrive according to provider instructions, and contact the clinic if they need to cancel or reschedule.",
      ] },
      { title: "Accounts and Guest Bookings", text: "Provide accurate information and keep account passwords and guest booking credentials confidential. You are responsible for activity performed through your account or booking credentials. Notify Medixo or the relevant provider if information is wrong or credentials may be compromised." },
      { title: "Provider and Staff Responsibilities", text: "Doctors, laboratories, clinics, staff, and administrators must keep their profiles, schedules, assignments, and patient records accurate and must use patient information only for authorized healthcare or clinic-operation purposes. Administrators are responsible for assigning staff access appropriately." },
      { title: "Notifications", text: "Notifications are a convenience and may be delayed, unavailable, or blocked by device, browser, network, or operating-system settings. Do not rely on a notification as the only source of an appointment or medical instruction. You can control notification permission through your device or browser settings." },
      { title: "Acceptable Use", bullets: [
        "Do not impersonate another person, create a misleading provider profile, or submit false appointment information.",
        "Do not access another user's account, booking, prescription, or health information without authorization.",
        "Do not interfere with the service, probe its security, upload malicious code, scrape data, or use Medixo for unlawful or harmful activity.",
        "Do not use Medixo to provide emergency care, make a medical diagnosis through an automated feature, or replace a qualified healthcare professional.",
      ] },
      { title: "Content and Service Availability", text: "You retain responsibility for information you submit. You grant Medixo permission to process and display that information as needed to provide the service. We may correct, remove, restrict, suspend, or terminate access to content or accounts that violate these Terms, create risk, or are required to be removed by law. We may modify or temporarily suspend features for maintenance, security, or operational reasons." },
      { title: "Fees and Third-Party Services", text: "Any consultation, laboratory, clinic, or other provider fee is determined by the relevant provider unless clearly stated otherwise. Medixo may link to or rely on third-party services, websites, networks, or devices. Their terms, availability, and privacy practices may apply separately." },
      { title: "Disclaimer and Liability", text: "Medixo is provided on an availability basis. To the extent allowed by law, Medixo is not responsible for provider decisions, inaccurate provider-submitted information, missed appointments, network or notification failures, or outcomes resulting from a healthcare relationship between a patient and provider. Nothing in these Terms limits rights or liability that cannot legally be limited." },
      { title: "Changes and Contact", text: "We may update these Terms when the service or legal requirements change. Continued use after an update means you accept the revised Terms. Questions about these Terms can be sent to support@medixo.com." },
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
          <p className="legal-eyebrow">Effective {EFFECTIVE_DATE}</p>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </section>
      <section className="legal-shell legal-content">
        {content.sections.map((section) => (
          <article className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.text ? <p>{section.text}</p> : null}
            {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
          </article>
        ))}
        {content.deletionLink ? (
          <article className="legal-section legal-action-section">
            <h2>Request account deletion</h2>
            <p>Use our public <a href="/delete-account">account deletion page</a> if you cannot sign in to the app.</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}
