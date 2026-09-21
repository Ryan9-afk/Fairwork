"use client";

import { AlertTriangle, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Baby, Banknote, Bell, BriefcaseBusiness, CalendarDays, Camera, Check, ChevronRight, Download, Eye, FileCheck2, FileText, FolderLock, HeartPulse, Home, Languages, MapPin, Plus, ReceiptText, Scale, ShieldCheck, UserRound } from "lucide-react";
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
  const [toastMessage, setToastMessage] = useState("Shift saved to your device");
  const [incidentType, setIncidentType] = useState("");
  const [shifts, setShifts] = useState<Shift[]>(seedShifts);
  const [form, setForm] = useState({ employer: "", location: "", date: "2026-09-20", start: "08:00", end: "17:30", agreed: "1200", paid: "1000", sunday: true });
  const t = copy[lang];
  const result = useMemo(() => audit(Number(form.agreed) || 0, Number(form.paid) || 0, form.start, form.end, form.sunday), [form]);
  useEffect(() => { const stored = window.localStorage.getItem("fairwork-pulse-shifts"); if (stored) { try { setShifts(JSON.parse(stored)) } catch {} } const requested = new URLSearchParams(window.location.search).get("screen") || "home"; if (["home", "records", "incidents", "dossier"].includes(requested)) setActive(requested) }, []);
  function navigate(id: string) { setActive(id); setIncidentType(""); const url = id === "home" ? window.location.pathname : `${window.location.pathname}?screen=${id}`; window.history.replaceState(null, "", url); window.scrollTo({ top: 0, behavior: "smooth" }) }
  function showToast(message: string) { setToastMessage(message); setSavedPulse(true); setTimeout(() => setSavedPulse(false), 2200) }
  function submit(e: FormEvent) { e.preventDefault(); const next: Shift = { id: Date.now(), date: form.date, employer: form.employer || "Employer not named", location: form.location || "Site not named", start: form.start, end: form.end, agreed: Number(form.agreed), paid: Number(form.paid), sunday: form.sunday }; const updated = [next, ...shifts]; setShifts(updated); window.localStorage.setItem("fairwork-pulse-shifts", JSON.stringify(updated)); showToast("Shift saved to your device") }
  const totalOwed = shifts.reduce((sum, shift) => sum + audit(shift.agreed, shift.paid, shift.start, shift.end, shift.sunday).total, 0);
  const nav = [["home", Home, t.log], ["records", ReceiptText, t.records], ["incidents", HeartPulse, t.incidents], ["dossier", FolderLock, t.dossier]] as const;
  const mobileNav = [["home", Home, "Home"], ["records", ReceiptText, t.records], ["quick-log", Plus, t.log], ["incidents", HeartPulse, t.incidents], ["dossier", FolderLock, t.dossier]] as const;

  return <main className="app-shell">
    <header className="topbar">
      <button className="profile-greeting" type="button" aria-label="Worker profile"><span className="profile-photo">AM</span><span><small>Welcome back,</small><strong>Amina M.</strong></span></button>
      <div className="header-actions"><div className="device-status"><ShieldCheck size={17} /><span>{t.saved}</span></div><Button variant="iosTinted" size="iosIcon" className="language" onClick={() => setLang(lang === "en" ? "sw" : "en")} aria-label="Change language"><Languages size={18} /><span>{lang === "en" ? "Kiswahili" : "English"}</span></Button><Button variant="iosTinted" size="iosIcon" className="notification" aria-label="Notifications"><Bell size={19} /><i /></Button></div>
    </header>
    <div className="desktop-grid" id="top">
      <aside className="side-nav" aria-label="Primary navigation">
        <div className="worker-card"><div className="worker-avatar">AM</div><div><strong>Amina M.</strong><span>Construction · Nairobi</span></div></div>
        <nav>{nav.map(([id, Icon, label]) => <Button type="button" variant="iosPlain" key={id} className={active === id ? "nav-item active" : "nav-item"} aria-current={active === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={20} /><span>{label}</span>{id === "incidents" && <i>1</i>}</Button>)}</nav>
        <div className="offline-note"><ShieldCheck size={20} /><strong>{t.private}</strong><p>{t.privateText}</p></div>
      </aside>
      <section className={active === "home" ? "main-column" : "main-column show-secondary"}>
        {active !== "home" && <section className="secondary-screen">
          <div className="secondary-nav"><Button variant="iosPlain" onClick={() => setActive("home")}><ArrowLeft />Back</Button><span>{active === "records" ? t.records : active === "incidents" ? t.incidents : t.dossier}</span><span /></div>
          {active === "records" && <><div className="secondary-title"><div><h1>{t.records}</h1><p>Every shift stored in this device vault.</p></div><Button variant="iosTinted" size="iosIcon" onClick={() => setActive("home")} aria-label="Add a shift"><Plus /></Button></div><div className="ios-summary"><span><b>{shifts.length}</b> shifts</span><span><b>{money(totalOwed)}</b> indicated due</span></div><div className="ledger full-ledger">{shifts.map((shift) => { const item = audit(shift.agreed, shift.paid, shift.start, shift.end, shift.sunday); return <Button variant="iosPlain" className="ledger-row" key={shift.id}><span className="ledger-date"><b>{new Date(`${shift.date}T12:00:00`).getDate()}</b><small>{new Date(`${shift.date}T12:00:00`).toLocaleString("en", {month: "short"}).toUpperCase()}</small></span><span className="ledger-main"><strong>{shift.employer}</strong><small>{shift.location} · {shift.start}–{shift.end}</small></span><span className="ledger-status"><strong className={item.total ? "danger" : "paid"}>{item.total ? `${money(item.total)} due` : "Paid in full"}</strong><small>{item.extra.toFixed(1)} overtime hrs</small></span><ChevronRight /></Button> })}</div><Button variant="iosPrimary" className="screen-action" onClick={() => setActive("home")}><Plus />Log another shift</Button></>}
          {active === "incidents" && <><div className="secondary-title"><div><h1>{t.incidentTitle}</h1><p>Choose what happened. You can add evidence next.</p></div></div><div className="incident-choices"><Button variant="iosPlain" className={incidentType === "injury" ? "choice selected" : "choice"} onClick={() => setIncidentType("injury")}><span className="choice-icon red"><HeartPulse /></span><span><strong>Workplace injury</strong><small>Mtu akiumia · treatment and witnesses</small></span><ChevronRight /></Button><Button variant="iosPlain" className={incidentType === "wages" ? "choice selected" : "choice"} onClick={() => setIncidentType("wages")}><span className="choice-icon orange"><Banknote /></span><span><strong>Wages withheld</strong><small>Missing pay or unlawful deduction</small></span><ChevronRight /></Button><Button variant="iosPlain" className={incidentType === "maternity" ? "choice selected" : "choice"} onClick={() => setIncidentType("maternity")}><span className="choice-icon purple"><Baby /></span><span><strong>Maternity discrimination</strong><small>Pregnancy, leave, or dismissal</small></span><ChevronRight /></Button></div>{incidentType && <form className="incident-form" onSubmit={(e) => { e.preventDefault(); showToast("Incident saved privately on this device"); setIncidentType("") }}><label><span>When did it happen?</span><input type="date" defaultValue="2026-09-20" /></label><label><span>What happened?</span><textarea placeholder="Write the facts while they are fresh" required /></label><Button type="button" variant="iosTinted" className="evidence-button" onClick={() => showToast("Photo attachment ready for demo")}><Camera />Add photo or receipt</Button><Button type="submit" variant="iosPrimary">Save incident record</Button></form>}</>}
          {active === "dossier" && <><div className="secondary-title"><div><h1>{t.dossier}</h1><p>Your evidence, calculations, and next steps in one reviewable package.</p></div><span className="ready-badge"><Check />Ready</span></div><article className="dossier-preview"><header><div className="dossier-logo"><Scale /></div><div><strong>Fairwork Pulse</strong><span>Haki Dossier · Preview</span></div></header><div className="dossier-person"><span>Complainant</span><b>Amina M. · Construction worker</b><small>Nairobi · 14–18 September 2026</small></div><div className="dossier-total"><span>Indicative amount outstanding</span><strong>{money(totalOwed)}</strong><small>Wage deficit plus calculated overtime</small></div><ul><li><span>Work records</span><b>{shifts.length} attached</b></li><li><span>Evidence files</span><b>3 indexed</b></li><li><span>Legal references</span><b>Employment Act + WIBA</b></li></ul><p>Demo calculations require review against the applicable wage order and contract terms.</p></article><Button variant="iosPrimary" className="screen-action" onClick={() => window.print()}><Download />Open print / PDF</Button><Button variant="iosPlain" className="source-link" onClick={() => showToast("Sources are documented in the project register")}><FileText />Citation register included</Button></>}
        </section>}
        <div className="page-heading"><div><h1>{t.hello}</h1><p>{t.intro}</p></div><div className="date-chip"><CalendarDays size={18} /><span>Sun, 20 Sep</span></div></div>
        <section className="pulse-card" aria-label="Work record summary">
          <div className="pulse-card-top"><span><ShieldCheck size={16} /> Private device ledger</span><strong>FAIRWORK</strong></div>
          <p>Indicated amount due</p>
          <div className="pulse-balance"><strong>{money(totalOwed)}</strong><Eye size={21} /></div>
          <div className="pulse-card-meta"><span>SHIFT RECORDS<b>{shifts.length}</b></span><span>STATUS<b>{totalOwed > 0 ? "Action needed" : "Up to date"}</b></span></div>
        </section>
        <div className="quick-actions" aria-label="Quick actions">
          <Button type="button" variant="iosPlain" onClick={() => navigate("incidents")}><span><ArrowDownLeft /></span>Report incident</Button>
          <Button type="button" variant="iosPlain" onClick={() => navigate("dossier")}><span><ArrowUpRight /></span>Build dossier</Button>
          <Button type="button" variant="iosPlain" className="quick-add" onClick={() => document.querySelector(".shift-form")?.scrollIntoView({ behavior: "smooth" })} aria-label="Log a shift"><Plus /></Button>
        </div>
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
    <nav className="mobile-nav" aria-label="Mobile navigation">{mobileNav.map(([id, Icon, label]) => <Button type="button" variant="iosPlain" key={id} className={`${active === id ? "active" : ""} ${id === "quick-log" ? "nav-primary" : ""}`} aria-current={active === id ? "page" : undefined} onClick={() => { if (id === "quick-log") { navigate("home"); window.setTimeout(() => document.querySelector(".shift-form")?.scrollIntoView({ behavior: "smooth" }), 30) } else navigate(id) }}><span className="nav-icon"><Icon size={id === "quick-log" ? 25 : 21} /></span><span>{label}</span></Button>)}</nav>
    <div className={savedPulse ? "toast show" : "toast"}><Check size={18} /><span>{toastMessage}</span></div>
  </main>
}
