import { jsPDF } from "jspdf";
import { calculateSectorAudit, type KenyanSector } from "./legal-engine";
import type { StoredShift, StoredIncident, EvidenceAttachment, WorkerProfile } from "./vault-db";
import type { WorkArrangement } from "./work-arrangements";

export function dossierFilename(name: string, now = new Date()): string {
  const safe = name.replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim().replace(/[. ]+$/g, "").slice(0, 90) || "Haki-Dossier";
  return `${safe}-${now.toISOString().replace(/[:.]/g, "-")}.pdf`;
}

interface DossierData {
  shifts: StoredShift[];
  incidents: StoredIncident[];
  evidence: EvidenceAttachment[];
  profile: WorkerProfile | null;
  arrangements: WorkArrangement[];
  includePersonal: boolean;
  isDemoMode: boolean;
}

// Text is paginated line by line so even a single long incident can span pages.
export function createDossierPdf(data: DossierData, font?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  if (font) {
    doc.addFileToVFS("Geist.ttf", font);
    doc.addFont("Geist.ttf", "Geist", "normal");
    doc.setFont("Geist");
  }
  doc.setProperties({ title: "Haki Dossier", author: "Fairwork Pulse" });
  const width = 174;
  let y = 22;
  const room = (height: number) => {
    if (y + height > 274) { doc.addPage(); y = 22; }
  };
  const text = (value: string, size = 10) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, width) as string[];
    const lineHeight = size * 0.48;
    for (const line of lines) { room(lineHeight); doc.text(line, 18, y); y += lineHeight; }
    y += 2;
  };
  const heading = (value: string) => { room(20); y += 5; text(value, 14); };
  const money = (amount: number) => `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
  const arrangement = (id?: string) => data.arrangements.find((item) => item.id === id)?.label || "Existing work";
  const audits = data.shifts.map((shift) => ({ shift, audit: calculateSectorAudit((shift.sector || "construction") as KenyanSector, shift.agreed, shift.paid, shift.start, shift.end, shift.dayType ?? shift.sunday) }));

  text("Fairwork Pulse", 20);
  text("Haki Dossier · Worker-prepared record", 12);
  if (data.isDemoMode) text("SYNTHETIC DEMO", 12);
  text(`Prepared: ${new Date().toLocaleString("en-KE")}`, 9);
  heading("Worker details");
  text(data.includePersonal ? data.profile?.name || "Name not provided" : "Personal details excluded");
  if (data.includePersonal) text([data.profile?.county, data.profile?.phone].filter(Boolean).join(" · ") || "Location not provided");
  heading("Payment summary");
  text(`Recorded unpaid agreed amount: ${money(audits.reduce((sum, { audit }) => sum + audit.wageDeficit, 0))}`);
  text(`Separate estimated additional entitlement: ${money(audits.reduce((sum, { audit }) => sum + audit.overtimePayDue, 0))} · Needs review`);
  heading("Work and payment timeline");
  if (!audits.length) text("No work records selected.");
  for (const { shift, audit } of audits) {
    room(24);
    text(`${shift.date} · ${shift.employer}`, 12);
    text(`${arrangement(shift.arrangementId)} · ${shift.location} · ${shift.start}–${shift.end}`);
    text(`Day: ${shift.dayType === "public_holiday" ? "Public holiday" : (shift.dayType === "rest_day" || (!shift.dayType && shift.sunday)) ? "Weekly rest day / legacy holiday" : "Normal working day"}`);
    for (const line of audit.lineItems) {
      text(`${line.label}: ${money(line.amount)}${line.kind === "estimate" ? " (Needs review)" : ""}`);
      text(line.explanation, 9);
    }
    y += 3;
  }
  heading("Reported incidents");
  if (!data.incidents.length) text("No incidents selected.");
  for (const incident of data.incidents) {
    text(`${incident.date} · ${incident.category} · ${arrangement(incident.arrangementId)}`, 12);
    text(incident.description);
  }
  heading("Evidence index");
  if (!data.evidence.length) text("No evidence selected.");
  data.evidence.forEach((item, index) => {
    text(`#${index + 1} ${item.fileName}`, 12);
    text(`${item.createdAt.slice(0, 10)} · SHA-256 ${item.sha256Hash}`, 9);
    if (item.dataUrl?.startsWith("data:image/")) {
      try {
        const properties = doc.getImageProperties(item.dataUrl);
        const scale = Math.min(width / properties.width, 170 / properties.height);
        const w = properties.width * scale, h = properties.height * scale;
        room(h + 5);
        doc.addImage(item.dataUrl, properties.fileType, 18, y, w, h);
        y += h + 5;
      } catch { text("Image could not be embedded. Bring the original attachment.", 9); }
    } else { text("Indexed attachment; bring the original file separately.", 9); }
  });
  heading("Prepare for assistance");
  text("Confirm dates, times, breaks, and amounts. Bring original messages, receipts, photographs, and witness details. Ask an adviser which wage order and remedy process applies.");
  heading("Calculation notes");
  text("Recorded gaps use the agreed pay and payments entered. Hourly rates use agreed daily pay divided by 8. Normal-day overtime uses hours beyond 8 at 1.5×; rest days and public holidays use all worked hours at 2.0×. Payments are deducted without counting the agreed amount twice. Breaks and weekly overtime require review.");
  text("References for review: Employment Act, 2007 §§17–19 and §27; Regulation of Wages (General) Order. https://new.kenyalaw.org/", 9);
  text("This dossier organizes worker-provided information. It does not determine liability, guarantee admissibility, or replace legal advice.", 9);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFontSize(9);
    doc.text(`Fairwork Pulse · Page ${page} of ${pages}`, 18, 286);
  }
  return doc;
}
