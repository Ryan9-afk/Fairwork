"use client";

import { useMemo, useState } from "react";
import { Check, Download, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateSectorAudit, KenyanSector } from "@/lib/legal-engine";
import type { EvidenceAttachment, StoredIncident, StoredShift, WorkerProfile } from "@/lib/vault-db";

const money = (value: number) => `KSh ${Math.round(value).toLocaleString("en-KE")}`;

interface HakiDossierProps {
  shifts: StoredShift[];
  incidents: StoredIncident[];
  evidence: EvidenceAttachment[];
  profile: WorkerProfile | null;
  isDemoMode: boolean;
  onOpenEvidence: (attachment: EvidenceAttachment) => void;
}

export function HakiDossier({ shifts, incidents, evidence, profile, isDemoMode, onOpenEvidence }: HakiDossierProps) {
  const [includePersonal, setIncludePersonal] = useState(true);
  const [selectedShifts, setSelectedShifts] = useState(() => new Set(shifts.map((item) => item.id)));
  const [selectedIncidents, setSelectedIncidents] = useState(() => new Set(incidents.map((item) => item.id)));
  const [selectedEvidence, setSelectedEvidence] = useState(() => new Set(evidence.map((item) => item.id)));

  const chosenShifts = shifts.filter((item) => selectedShifts.has(item.id));
  const chosenIncidents = incidents.filter((item) => selectedIncidents.has(item.id));
  const chosenEvidence = evidence.filter((item) => selectedEvidence.has(item.id));
  const audits = useMemo(() => chosenShifts.map((shift) => ({
    shift,
    audit: calculateSectorAudit((shift.sector as KenyanSector) || "construction", shift.agreed, shift.paid, shift.start, shift.end, shift.sunday),
  })), [chosenShifts]);
  const recordedGap = audits.reduce((sum, item) => sum + item.audit.wageDeficit, 0);
  const estimatedEntitlement = audits.reduce((sum, item) => sum + item.audit.overtimePayDue, 0);

  function toggle<T extends string | number>(current: Set<T>, id: T, setter: (value: Set<T>) => void) {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  }

  return (
    <div className="dossier-workspace">
      <section className="dossier-controls" aria-label="Dossier export options">
        <div>
          <strong>Choose what to include</strong>
          <p>Your original records stay unchanged.</p>
        </div>
        <label className="dossier-toggle"><input type="checkbox" checked={includePersonal} onChange={(event) => setIncludePersonal(event.target.checked)} /> Include personal details</label>
        <details>
          <summary>Records ({chosenShifts.length + chosenIncidents.length})</summary>
          <div className="dossier-checklist">
            {shifts.map((item) => <label key={item.id}><input type="checkbox" checked={selectedShifts.has(item.id)} onChange={() => toggle(selectedShifts, item.id, setSelectedShifts)} /> Shift: {item.date} · {item.employer}</label>)}
            {incidents.map((item) => <label key={item.id}><input type="checkbox" checked={selectedIncidents.has(item.id)} onChange={() => toggle(selectedIncidents, item.id, setSelectedIncidents)} /> Incident: {item.date} · {item.category}</label>)}
          </div>
        </details>
        <details>
          <summary>Evidence ({chosenEvidence.length})</summary>
          <div className="dossier-checklist">
            {evidence.length ? evidence.map((item) => <label key={item.id}><input type="checkbox" checked={selectedEvidence.has(item.id)} onChange={() => toggle(selectedEvidence, item.id, setSelectedEvidence)} /> {item.fileName}</label>) : <p>No evidence attached.</p>}
          </div>
        </details>
      </section>

      <article className="dossier-preview" id="haki-dossier-print">
        <header>
          <div className="dossier-logo"><FileText /></div>
          <div><strong>Fairwork Pulse</strong><span>Haki Dossier · Worker-prepared record</span></div>
          {isDemoMode && <b className="demo-watermark">SYNTHETIC DEMO</b>}
        </header>

        <div className="dossier-person">
          <span>Worker details</span>
          <b>{includePersonal ? (profile?.name || "Name not provided") : "Personal details excluded"}</b>
          <small>{includePersonal ? [profile?.county, profile?.phone].filter(Boolean).join(" · ") || "Location not provided" : "Redacted for this export"}</small>
        </div>

        <div className="dossier-total">
          <span>Recorded unpaid agreed amount</span><strong>{money(recordedGap)}</strong>
          <small>Separate estimated additional entitlement: {money(estimatedEntitlement)} · Needs review</small>
        </div>

        <section className="dossier-section">
          <h2>Work and payment timeline</h2>
          {audits.length ? audits.map(({ shift, audit }) => (
            <div className="dossier-entry" key={shift.id}>
              <div><b>{shift.date} · {shift.employer}</b><span>{shift.location} · {shift.start}–{shift.end}</span></div>
              <dl>
                {audit.lineItems.map((line) => <div key={line.id}><dt>{line.label}{line.kind === "estimate" && <em>Needs review</em>}</dt><dd>{money(line.amount)}</dd><small>{line.explanation}</small></div>)}
              </dl>
            </div>
          )) : <p>No work records selected.</p>}
        </section>

        <section className="dossier-section">
          <h2>Reported incidents</h2>
          {chosenIncidents.length ? chosenIncidents.map((item) => <div className="dossier-entry" key={item.id}><b>{item.date} · {item.category}</b><p>{item.description}</p></div>) : <p>No incidents selected.</p>}
        </section>

        <section className="dossier-section">
          <h2>Evidence index</h2>
          {chosenEvidence.length ? chosenEvidence.map((item, index) => (
            <div className="evidence-export-item" key={item.id}>
              <button className="evidence-index-row" onClick={() => onOpenEvidence(item)}>
                <span><b>#{index + 1} {item.fileName}</b><small>{item.createdAt.slice(0, 10)} · SHA-256 {item.sha256Hash.slice(0, 16)}…</small></span><ExternalLink size={14} />
              </button>
              {item.dataUrl?.startsWith("data:image/") && (
                // The image is a worker-selected local attachment included in the print export.
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dossier-evidence-image" src={item.dataUrl} alt={`Selected evidence ${index + 1}: ${item.fileName}`} />
              )}
            </div>
          )) : <p>No evidence selected.</p>}
        </section>

        <section className="dossier-section assistance-checklist">
          <h2>Prepare for assistance</h2>
          <p><Check /> Confirm dates, times, breaks, and amounts with the worker.</p>
          <p><Check /> Bring original messages, receipts, photographs, and witness details where available.</p>
          <p><Check /> Ask an adviser which current wage order and remedy process applies.</p>
        </section>

        <section className="dossier-section legal-register">
          <h2>Calculation notes</h2>
          <p><ShieldCheck /> Recorded payment gaps come from the worker’s entries. Overtime figures are estimates and need review for occupation, location, breaks, and the wage order in force.</p>
          <p>Rule references: EMP-17-19 · WAGES-R5-6 · Source checked 21 September 2026.</p>
          <a href="https://new.kenyalaw.org/akn/ke/act/2007/11/eng@2012-01-02" target="_blank" rel="noreferrer">Employment Act, 2007 on Kenya Law <ExternalLink size={13} /></a>
          <p className="dossier-disclaimer">This dossier organizes worker-provided information. It does not determine liability, guarantee admissibility, or replace legal advice.</p>
        </section>
      </article>

      <Button variant="iosPrimary" className="screen-action dossier-print-action" onClick={() => window.print()} disabled={!chosenShifts.length && !chosenIncidents.length}>
        <Download /> Print or save selected dossier as PDF
      </Button>
    </div>
  );
}
