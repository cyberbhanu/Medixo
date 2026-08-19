import medixoLogo from "../assets/medixo logo .jpeg";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value) => {
  if (!value) return "Not scheduled";

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getDisplayValue = (value, fallback = "Not provided") =>
  value === undefined || value === null || value === "" ? fallback : value;

const printPrescription = (appointment) => {
  const doctor = appointment?.doctorId || {};
  const clinic = appointment?.clinic || {};
  const printWindow = window.open("", "medixo-prescription", "width=960,height=760");

  if (!printWindow) {
    window.alert("Please allow pop-ups to print the prescription sheet.");
    return;
  }

  const patientName = getDisplayValue(appointment?.patientName, "Patient");
  const doctorName = getDisplayValue(doctor.name, "Doctor");
  const clinicName = getDisplayValue(clinic.name, "Medixo Clinic");
  const patientDetails = [
    ["Patient name", patientName],
    ["Age / gender", `${getDisplayValue(appointment?.patientAge)} / ${getDisplayValue(appointment?.patientGender)}`],
    ["Phone", getDisplayValue(appointment?.patientPhone)],
    ["Email", getDisplayValue(appointment?.patientEmail)],
    ["Appointment", `${formatDate(appointment?.appointmentDate)} at ${getDisplayValue(appointment?.appointmentTime)}`],
    ["Reason for visit", getDisplayValue(appointment?.reason)],
  ];

  const detailsMarkup = patientDetails
    .map(([label, value]) => `<div class="detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>Medixo Prescription - ${escapeHtml(patientName)}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #172033; background: #fff; font-family: Arial, sans-serif; }
          .sheet { width: 100%; min-height: 270mm; position: relative; padding-bottom: 24mm; }
          .brand { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 2px solid #0d5bdd; }
          .brand-main { display: flex; align-items: center; gap: 14px; }
          .logo { width: 62px; height: 62px; object-fit: contain; border-radius: 12px; }
          .brand h1 { margin: 0; color: #0d5bdd; font-size: 28px; letter-spacing: 0.04em; }
          .brand p { margin: 4px 0 0; color: #60708a; font-size: 11px; }
          .clinic { color: #253b67; font-size: 13px; font-weight: 700; text-align: right; }
          .clinic small { display: block; margin-top: 5px; color: #60708a; font-size: 11px; font-weight: 400; }
          .title-row { display: flex; justify-content: space-between; gap: 24px; margin: 22px 0 12px; }
          .title-row h2 { margin: 0; font-size: 20px; }
          .title-row span { color: #60708a; font-size: 12px; }
          .details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid #d9e4f2; border-radius: 8px; overflow: hidden; }
          .detail { display: grid; gap: 4px; padding: 10px 12px; border-right: 1px solid #d9e4f2; border-bottom: 1px solid #d9e4f2; }
          .detail:nth-child(2n) { border-right: 0; }
          .detail:nth-last-child(-n + 2) { border-bottom: 0; }
          .detail span { color: #60708a; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
          .detail strong { color: #172033; font-size: 13px; font-weight: 700; }
          .rx-heading { display: flex; align-items: center; gap: 12px; margin: 26px 0 12px; color: #0d5bdd; font-size: 18px; font-weight: 800; }
          .rx-heading::before { content: "Rx"; display: grid; place-items: center; width: 34px; height: 34px; color: #fff; background: #0d5bdd; border-radius: 50%; font-family: Georgia, serif; font-size: 19px; font-style: italic; }
          .line { height: 30px; border-bottom: 1px solid #b9c6d8; }
          .notes { margin-top: 22px; }
          .notes h3 { margin: 0 0 8px; color: #253b67; font-size: 13px; }
          .notes-box { height: 68px; border: 1px solid #d9e4f2; border-radius: 8px; }
          .footer { position: absolute; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-between; gap: 20px; padding-top: 12px; border-top: 1px solid #d9e4f2; color: #60708a; font-size: 10px; }
          .signature { min-width: 170px; padding-top: 20px; border-top: 1px solid #172033; color: #172033; text-align: center; }
          @media print { .sheet { min-height: auto; } }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="brand">
            <div class="brand-main">
              <img class="logo" src="${escapeHtml(medixoLogo)}" alt="Medixo" />
              <div><h1>MEDIXO</h1><p>Healthcare coordination and patient care</p></div>
            </div>
            <div class="clinic">Dr. ${escapeHtml(doctorName)}<small>${escapeHtml(clinicName)}</small></div>
          </header>
          <div class="title-row"><h2>Prescription / Consultation Sheet</h2><span>Prepared for the attending doctor</span></div>
          <section class="details">${detailsMarkup}</section>
          <div class="rx-heading">Prescription</div>
          <section aria-label="Prescription writing area">
            ${Array.from({ length: 8 }, () => '<div class="line"></div>').join("")}
          </section>
          <section class="notes"><h3>Doctor notes and follow-up</h3><div class="notes-box"></div></section>
          <footer class="footer"><span>Medixo | This sheet is for clinical use and should be completed by the attending doctor.</span><span class="signature">Doctor signature</span></footer>
        </main>
        <script>
          window.addEventListener("load", () => { window.focus(); window.print(); });
        </script>
      </body>
    </html>`);
  printWindow.document.close();
};

export default function PrescriptionPrintButton({ appointment, compact = false }) {
  return (
    <button
      type="button"
      className={compact ? "dashboard-secondary-action dashboard-compact-action" : "dashboard-primary-action"}
      onClick={() => printPrescription(appointment)}
    >
      Print Blank Rx
    </button>
  );
}
