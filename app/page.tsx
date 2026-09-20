"use client";

import { AlertTriangle, ArrowRight, BriefcaseBusiness, CalendarDays, Check, ChevronRight, FileCheck2, FileText, FolderLock, HeartPulse, Home, Languages, MapPin, Plus, ReceiptText, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Shift = { id: number; date: string; employer: string; location: string; start: string; end: string; agreed: number; paid: number; sunday: boolean };
const seedShifts: Shift[] = [
  { id: 1, date: "2026-09-18", employer: "Karibu Builders", location: "Kilimani", start: "07:30", end: "17:30", agreed: 1200, paid: 1000, sunday: false },
  { id: 2, date: "2026-09-17", employer: "Karibu Builders", location: "Kilimani", start: "08:00", end: "16:30", agreed: 1200, paid: 1200, sunday: false },
  { id: 3, date: "2026-09-14", employer: "Maua Contractors", location: "Ngara", start: "08:00", end: "15:00", agreed: 1100, paid: 700, sunday: true },
];
const copy = {
  en: { hello: "Your work record", intro: "Log today’s shift. The totals update before you save.", saved: "Saved on this device", log: "Log a shift", records: "Records", incidents: "Incidents", dossier: "Haki Dossier", employer: "Employer or contractor", site: "Work site", start: "Start time", end: "End time", agreed: "Agreed pay", paid: "Amount received", rest: "Sunday or public holiday", save: "Save shift record", shortfall: "Wage shortfall", overtime: "Overtime due", total: "Total indicated claim", recent: "Recent records", viewAll: "View ledger", private: "Private by default", privateText: "Your identifiable records stay in this browser. Nothing is uploaded in this MVP.", incidentTitle: "Record what happened", incidentText: "Capture an injury, dismissal, wage withholding, or maternity discrimination while details are fresh.", startIncident: "Start incident record", dossierText: "Compile your shifts, calculations, and evidence into one indexed dispute package.", build: "Build dossier preview" },
  sw: { hello: "Rekodi yako ya kazi", intro: "Weka zamu ya leo. Jumla zinajihesabu kabla uhifadhi.", saved: "Imehifadhiwa kwa simu hii", log: "Weka zamu", records: "Rekodi", incidents: "Matukio", dossier: "Jalada la Haki", employer: "Mwajiri au kontrakta", site: "Mahali pa kazi", start: "Saa ya kuanza", end: "Saa ya kumaliza", agreed: "Malipo mliyokubaliana", paid: "Kiasi ulicholipwa", rest: "Jumapili au sikukuu", save: "Hifadhi rekodi ya zamu", shortfall: "Upungufu wa mshahara", overtime: "Malipo ya saa za ziada", total: "Jumla inayodaiwa", recent: "Rekodi za hivi karibuni", viewAll: "Fungua leja", private: "Ni yako pekee", privateText: "Rekodi zako zinabaki kwenye kivinjari hiki. Hakuna kinachotumwa mtandaoni kwa sasa.", incidentTitle: "Andika kilichotokea", incidentText: "Hifadhi jeraha, kufukuzwa, kuzuiwa mshahara, au ubaguzi wa uzazi kabla hujasahau.", startIncident: "Anza rekodi ya tukio", dossierText: "Kusanya zamu, hesabu na ushahidi wako katika jalada moja lenye mpangilio.", build: "Tengeneza hakikisho la jalada" },
};
const money = (value: number) => `KSh ${Math.round(value).toLocaleString("en-KE")}`;
function hoursBetween(start: string, end: string) { const [sh, sm] = start.split(":").map(Number); const [eh, em] = end.split(":").map(Number); return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60) }
function audit(agreed: number, paid: number, start: string, end: string, sunday: boolean) { const hours = hoursBetween(start, end); const extra = Math.max(0, hours - 8); const overtime = extra * (agreed / 8) * (sunday ? 2 : 1.5); const deficit = Math.max(0, agreed - paid); return { hours, extra, overtime, deficit, total: overtime + deficit } }

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "sw">("en");
  const [active, setActive] = useState("home");
  const [savedPulse, setSavedPulse] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>(seedShifts);
  const [form, setForm] = useState({ employer: "", location: "", date: "2026-09-20", start: "08:00", end: "17:30", agreed: "1200", paid: "1000", sunday: true });
  const t = copy[lang];
  const result = useMemo(() => audit(Number(form.agreed) || 0, Number(form.paid) || 0, form.start, form.end, form.sunday), [form]);
  useEffect(() => { const stored = window.localStorage.getItem("fairwork-pulse-shifts"); if (stored) { try { setShifts(JSON.parse(stored)) } catch {} } }, []);
  function submit(e: FormEvent) { e.preventDefault(); const next: Shift = { id: Date.now(), date: form.date, employer: form.employer || "Employer not named", location: form.location || "Site not named", start: form.start, end: form.end, agreed: Number(form.agreed), paid: Number(form.paid), sunday: form.sunday }; const updated = [next, ...shifts]; setShifts(updated); window.localStorage.setItem("fairwork-pulse-shifts", JSON.stringify(updated)); setSavedPulse(true); setTimeout(() => setSavedPulse(false), 2200) }
  const totalOwed = shifts.reduce((sum, shift) => sum + audit(shift.agreed, shift.paid, shift.start, shift.end, shift.sunday).total, 0);
  const nav = [["home", Home, t.log], ["records", ReceiptText, t.records], ["incidents", HeartPulse, t.incidents], ["dossier", FolderLock, t.dossier]] as const;

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Fairwork Pulse home"><span className="brand-mark"><Check size={18} strokeWidth={3} /></span><span>Fairwork <b>Pulse</b></span></a>
      <div className="header-actions"><div className="device-status"><ShieldCheck size={17} /><span>{t.saved}</span></div><Button variant="iosTinted" size="iosIcon" className="language" onClick={() => setLang(lang === "en" ? "sw" : "en")} aria-label="Change language"><Languages size={18} /><span>{lang === "en" ? "Kiswahili" : "English"}</span></Button><Button variant="iosTinted" size="iosIcon" className="avatar" aria-label="Worker profile"><UserRound size={20} /></Button></div>
    </header>
    <div className="desktop-grid" id="top">
      <aside className="side-nav" aria-label="Primary navigation">
        <div className="worker-card"><div className="worker-avatar">AM</div><div><strong>Amina M.</strong><span>Construction · Nairobi</span></div></div>
        <nav>{nav.map(([id, Icon, label]) => <Button variant="iosPlain" key={id} className={active === id ? "nav-item active" : "nav-item"} onClick={() => setActive(id)}><Icon size={20} /><span>{label}</span>{id === "incidents" && <i>1</i>}</Button>)}</nav>
        <div className="offline-note"><ShieldCheck size={20} /><strong>{t.private}</strong><p>{t.privateText}</p></div>
      </aside>
      <section className="main-column">
        <div className="page-heading"><div><h1>{t.hello}</h1><p>{t.intro}</p></div><div className="date-chip"><CalendarDays size={18} /><span>Sun, 20 Sep</span></div></div>
        <form className="shift-form" onSubmit={submit}>
          <div className="form-title"><div className="title-icon"><BriefcaseBusiness size={23} /></div><div><h2>{t.log}</h2><p>About 30 seconds · works offline</p></div><span className="form-step">NEW RECORD</span></div>
          <div className="fields">
            <label className="span-2"><span>{t.employer}</span><input value={form.employer} onChange={(e) => setForm({...form, employer: e.target.value})} placeholder="e.g. contractor or household" /></label>
            <label><span>{t.site}</span><div className="input-icon"><MapPin size={17} /><input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="Area / town" /></div></label>
            <label><span>Date</span><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} /></label>
            <label><span>{t.start}</span><input type="time" value={form.start} onChange={(e) => setForm({...form, start: e.target.value})} /></label>
            <label><span>{t.end}</span><input type="time" value={form.end} onChange={(e) => setForm({...form, end: e.target.value})} /></label>
            <label><span>{t.agreed}</span><div className="currency-input"><b>KSh</b><input inputMode="numeric" value={form.agreed} onChange={(e) => setForm({...form, agreed: e.target.value})} /></div></label>
            <label><span>{t.paid}</span><div className="currency-input"><b>KSh</b><input inputMode="numeric" value={form.paid} onChange={(e) => setForm({...form, paid: e.target.value})} /></div></label>
          </div>
          <div className="form-footer"><label className="check-line"><input type="checkbox" checked={form.sunday} onChange={(e) => setForm({...form, sunday: e.target.checked})} /><span><Check size={15} /></span>{t.rest}</label><Button variant="iosPrimary" className="save-button" type="submit">{savedPulse ? <><Check size={20} /> Saved</> : <><Plus size={20} /> {t.save}</>}</Button></div>
        </form>
        <section className="audit-strip" aria-live="polite">
          <div className="audit-intro"><span className="audit-stamp">LIVE AUDIT</span><p>{result.hours.toFixed(1)} hrs recorded</p></div>
          <div><span>{t.shortfall}</span><strong className={result.deficit ? "danger" : "ok"}>{money(result.deficit)}</strong><small>Employment Act §§17–19</small></div>
          <div><span>{t.overtime}</span><strong>{money(result.overtime)}</strong><small>{result.extra.toFixed(1)} hrs × {form.sunday ? "2.0" : "1.5"}</small></div>
          <div className="claim-total"><span>{t.total}</span><strong>{money(result.total)}</strong><small>Indicative calculation</small></div>
        </section>
        <section className="records-section">
          <div className="section-heading"><div><h2>{t.recent}</h2><p>{shifts.length} records in your device vault</p></div><Button variant="iosPlain" onClick={() => setActive("records")}>{t.viewAll}<ArrowRight size={18} /></Button></div>
          <div className="ledger">{shifts.slice(0, 3).map((shift) => { const item = audit(shift.agreed, shift.paid, shift.start, shift.end, shift.sunday); return <Button variant="iosPlain" className="ledger-row" key={shift.id}><span className="ledger-date"><b>{new Date(`${shift.date}T12:00:00`).getDate()}</b><small>{new Date(`${shift.date}T12:00:00`).toLocaleString("en", {month: "short"}).toUpperCase()}</small></span><span className="ledger-main"><strong>{shift.employer}</strong><small><MapPin size={13} />{shift.location} · {shift.start}–{shift.end}</small></span><span className="ledger-status"><strong className={item.total ? "danger" : "paid"}>{item.total ? `${money(item.total)} due` : "Paid in full"}</strong><small>{item.extra.toFixed(1)} overtime hrs</small></span><ChevronRight size={19} /></Button> })}</div>
        </section>
      </section>
      <aside className="right-rail">
        <section className="claim-card"><div className="claim-top"><FileCheck2 size={22} /><span>DEVICE LEDGER</span></div><p>Estimated amount recorded as outstanding</p><strong>{money(totalOwed)}</strong><div className="claim-meta"><span><b>{shifts.length}</b> shifts</span><span><b>2</b> employers</span><span><b>3</b> proofs</span></div></section>
        <section className="action-panel dossier-panel"><div className="action-icon"><FileText size={24} /></div><h2>{t.dossier}</h2><p>{t.dossierText}</p><ul><li><Check size={15} /> Shift audit ledger</li><li><Check size={15} /> Statutory references</li><li><Check size={15} /> Annexed evidence</li></ul><Button variant="secondary" onClick={() => setActive("dossier")}>{t.build}<ArrowRight size={18} /></Button></section>
        <section className="action-panel incident-panel"><div className="action-icon"><AlertTriangle size={24} /></div><h2>{t.incidentTitle}</h2><p>{t.incidentText}</p><Button variant="outline" onClick={() => setActive("incidents")}>{t.startIncident}<ChevronRight size={18} /></Button></section>
        <p className="legal-note"><ShieldCheck size={16} /> Calculations are guidance, not legal advice. A labour officer can review your dossier.</p>
      </aside>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(([id, Icon, label]) => <Button variant="iosPlain" key={id} className={active === id ? "active" : ""} onClick={() => setActive(id)}><Icon size={21} /><span>{label}</span></Button>)}</nav>
    <div className={savedPulse ? "toast show" : "toast"}><Check size={18} /><span>Shift saved to your device</span></div>
  </main>
}
