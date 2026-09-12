import medixoLogo from "../assets/medixo logo .jpeg";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const printPrescription = (appointment) => {
  const doctor = appointment?.doctorId || {};
  const clinic = appointment?.clinic || {};
  const patientFields = [
    ["Patient name", appointment?.patientName],
    ["Age", appointment?.patientAge],
    ["Mobile", appointment?.patientPhone],
    ["Weight", appointment?.patientWeight],
    ["B.P.", appointment?.bloodPressure],
    ["Address", appointment?.patientAddress],
  ];
  const printWindow = window.open("", "medixo-prescription", "width=960,height=760");

  if (!printWindow) {
    window.alert("Please allow pop-ups to print the prescription sheet.");
    return;
  }

  const patientFieldsMarkup = patientFields
    .map(([label, value], index) => `<div class="patient-field ${index === patientFields.length - 1 ? "wide" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "")}</strong></div>`)
    .join("");
  const doctorName = escapeHtml(doctor.name || "Doctor");
  const clinicName = escapeHtml(clinic.name || "Medixo Clinic");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>Medixo Prescription - ${escapeHtml(appointment?.patientName || "Patient")}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #172033; background: #fff; font-family: Arial, sans-serif; }
          .sheet { min-height: 270mm; position: relative; }
          .brand { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 2px solid #0d5bdd; }
          .brand-main { display: flex; align-items: center; gap: 14px; }
          .logo { width: 62px; height: 62px; object-fit: contain; border-radius: 12px; }
          .brand h1 { margin: 0; color: #0d5bdd; font-size: 28px; letter-spacing: .04em; }
          .brand p { margin: 4px 0 0; color: #60708a; font-size: 11px; }
          .clinic { color: #253b67; font-size: 13px; font-weight: 700; text-align: right; }
          .clinic small { display: block; margin-top: 5px; color: #60708a; font-size: 11px; font-weight: 400; }
          .patient-header { margin-top: 18px; border: 1px solid #d9e4f2; border-radius: 8px; overflow: hidden; }
          .patient-header-title { padding: 10px 12px; color: #0d5bdd; background: #f5f9ff; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
          .patient-fields { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .patient-field { display: grid; gap: 6px; min-height: 58px; padding: 10px 12px; border-right: 1px solid #d9e4f2; border-top: 1px solid #d9e4f2; }
          .patient-field.wide { grid-column: 1 / -1; border-right: 0; }
          .patient-field:nth-child(5) { border-right: 0; }
          .patient-field span { color: #60708a; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
          .patient-field strong { min-height: 19px; color: #172033; font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
          .blank-rx { position: relative; min-height: 205mm; margin-top: 20px; }
          .rx-mark { position: absolute; top: 4px; left: 0; color: #0d5bdd; font-family: Georgia, serif; font-size: 26px; font-style: italic; font-weight: 700; }
          @media print { .sheet { min-height: auto; } .blank-rx { min-height: 205mm; } }
          @media (max-width: 700px) { .patient-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); } .patient-field { border-right: 1px solid #d9e4f2; } .patient-field:nth-child(2n) { border-right: 0; } .patient-field.wide { grid-column: 1 / -1; } }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="brand">
            <div class="brand-main">
              <img class="logo" src="${escapeHtml(medixoLogo)}" alt="Medixo" />
              <div><h1>MEDIXO</h1><p>Healthcare coordination and patient care</p></div>
            </div>
            <div class="clinic">Dr. ${doctorName}<small>${clinicName}</small></div>
          </header>
          <section class="patient-header">
            <div class="patient-header-title">Patient details</div>
            <div class="patient-fields">${patientFieldsMarkup}</div>
          </section>
          <section class="blank-rx" aria-label="Blank prescription area"><div class="rx-mark">Rx</div></section>
        </main>
        <script>window.addEventListener("load", () => { window.focus(); window.print(); });</script>
      </body>
    </html>`);
  printWindow.document.close();
};

export default function PrescriptionPrintButton({ compact = false, appointment }) {
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
