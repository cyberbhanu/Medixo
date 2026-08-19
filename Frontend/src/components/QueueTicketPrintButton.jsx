import medixoLogo from "../assets/medixo logo .jpeg";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const display = (value, fallback = "Not provided") =>
  value === undefined || value === null || value === "" ? fallback : value;

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

const printQueueTicket = (appointment) => {
  const doctor = appointment?.doctorId || {};
  const clinic = appointment?.clinic || {};
  const printWindow = window.open("", "medixo-queue-ticket", "width=900,height=760");

  if (!printWindow) {
    window.alert("Please allow pop-ups to print the patient queue sheet.");
    return;
  }

  const patientName = display(appointment?.patientName, "Patient");
  const queueNumber = display(appointment?.queueNumber, "-");
  const clinicName = display(clinic.name, "Medixo Clinic");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>Medixo Queue - ${escapeHtml(patientName)}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #172033; background: #fff; font-family: Arial, sans-serif; }
          .sheet { min-height: 260mm; padding-bottom: 24mm; position: relative; }
          .brand { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 16px; border-bottom: 2px solid #0d5bdd; }
          .brand-main { display: flex; align-items: center; gap: 12px; }
          .logo { width: 58px; height: 58px; object-fit: contain; border-radius: 10px; }
          .brand h1 { margin: 0; color: #0d5bdd; font-size: 26px; letter-spacing: .04em; }
          .brand p { margin: 3px 0 0; color: #64748b; font-size: 11px; }
          .clinic { color: #253b67; font-size: 13px; font-weight: 700; text-align: right; }
          .clinic small { display: block; margin-top: 4px; color: #64748b; font-weight: 400; }
          .heading { margin: 24px 0 16px; }
          .heading h2 { margin: 0; color: #172033; font-size: 21px; }
          .heading p { margin: 5px 0 0; color: #64748b; font-size: 12px; }
          .queue-box { display: grid; grid-template-columns: 190px 1fr; gap: 24px; align-items: center; padding: 24px; border: 1px solid #cfe0f4; border-radius: 12px; background: #f5f9ff; }
          .queue-number { display: grid; place-items: center; min-height: 150px; color: #fff; background: #0d5bdd; border-radius: 12px; }
          .queue-number small { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
          .queue-number strong { font-size: 68px; line-height: 1; }
          .patient h3 { margin: 0; color: #172033; font-size: 25px; }
          .patient p { margin: 8px 0 0; color: #64748b; font-size: 13px; }
          .details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 22px; }
          .detail { padding: 13px; border: 1px solid #d9e4f2; border-radius: 8px; }
          .detail span { display: block; margin-bottom: 5px; color: #64748b; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
          .detail strong { color: #172033; font-size: 13px; }
          .instructions { margin-top: 24px; padding: 16px; border-left: 4px solid #0d5bdd; background: #f8fbff; }
          .instructions h3 { margin: 0 0 6px; color: #253b67; font-size: 14px; }
          .instructions p { margin: 0; color: #64748b; font-size: 12px; line-height: 1.6; }
          .footer { position: absolute; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-between; gap: 20px; padding-top: 14px; border-top: 1px solid #d9e4f2; color: #64748b; font-size: 10px; }
          .signature { min-width: 145px; padding-top: 18px; border-top: 1px solid #172033; color: #172033; text-align: center; }
          @media print { .sheet { min-height: auto; } }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="brand">
            <div class="brand-main"><img class="logo" src="${escapeHtml(medixoLogo)}" alt="Medixo" /><div><h1>MEDIXO</h1><p>Patient queue and visit coordination</p></div></div>
            <div class="clinic">${escapeHtml(clinicName)}<small>Dr. ${escapeHtml(display(doctor.name, "Assigned doctor"))}</small></div>
          </header>
          <section class="heading"><h2>Patient Queue / Visit Slip</h2><p>Keep this sheet ready for front-desk and doctor coordination.</p></section>
          <section class="queue-box"><div class="queue-number"><div><small>Queue number</small><strong>${escapeHtml(queueNumber)}</strong></div></div><div class="patient"><h3>${escapeHtml(patientName)}</h3><p>${escapeHtml(display(appointment?.reason, "Consultation appointment"))}</p><p>${escapeHtml(formatDate(appointment?.appointmentDate))} at ${escapeHtml(display(appointment?.appointmentTime))}</p></div></section>
          <section class="details">
            <div class="detail"><span>Age / gender</span><strong>${escapeHtml(display(appointment?.patientAge))} / ${escapeHtml(display(appointment?.patientGender))}</strong></div>
            <div class="detail"><span>Phone</span><strong>${escapeHtml(display(appointment?.patientPhone))}</strong></div>
            <div class="detail"><span>Email</span><strong>${escapeHtml(display(appointment?.patientEmail))}</strong></div>
            <div class="detail"><span>Status</span><strong>${escapeHtml(display(appointment?.status))}</strong></div>
          </section>
          <section class="instructions"><h3>Front-desk note</h3><p>Please confirm the patient details, mark the appointment status in Medixo, and hand this sheet to the attending doctor with the blank prescription page.</p></section>
          <footer class="footer"><span>Medixo | Queue ${escapeHtml(queueNumber)} | Printed for clinical coordination</span><span class="signature">Staff signature</span></footer>
        </main>
        <script>window.addEventListener("load", () => { window.focus(); window.print(); });</script>
      </body>
    </html>`);
  printWindow.document.close();
};

export default function QueueTicketPrintButton({ appointment }) {
  return (
    <button
      type="button"
      className="dashboard-secondary-action dashboard-compact-action"
      onClick={() => printQueueTicket(appointment)}
    >
      Print Queue Slip
    </button>
  );
}
