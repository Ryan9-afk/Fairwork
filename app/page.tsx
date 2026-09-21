"use client";

import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Baby,
  Banknote,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Cloud,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderLock,
  HeartPulse,
  Home,
  Languages,
  Lock,
  MapPin,
  Plus,
  ReceiptText,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Unlock,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

// Modules
import {
  calculateSectorAudit,
  KenyanSector,
  SECTOR_CONFIGS,
  ShiftAuditResult,
} from "@/lib/legal-engine";
import {
  getAllShifts,
  saveShift,
  getAllIncidents,
  saveIncident,
  getAllEvidence,
  getVaultMetadata,
  saveVaultMetadata,
  StoredShift,
  StoredIncident,
  EvidenceAttachment,
} from "@/lib/vault-db";
import {
  deriveKeyFromPin,
  encryptData,
  createVaultVerificationToken,
  verifyVaultKey,
  generateSalt,
  bufferToBase64,
  base64ToBuffer,
} from "@/lib/crypto";

// Components
import { EvidenceModal } from "@/components/evidence-modal";
import { VaultLockModal } from "@/components/vault-lock-modal";
import { AIAssistantDrawer } from "@/components/ai-assistant-drawer";
import { RegulatorDashboard } from "@/components/regulator-dashboard";
import { FeaturePhoneModal } from "@/components/feature-phone-modal";
import { CloudSyncModal } from "@/components/cloud-sync-modal";
import { ImageViewerModal } from "@/components/image-viewer-modal";

const seedShifts: StoredShift[] = [
  { id: 1, date: "2026-09-18", employer: "Karibu Builders", location: "Kilimani", start: "07:30", end: "17:30", agreed: 1200, paid: 1000, sunday: false, sector: "construction" },
  { id: 2, date: "2026-09-17", employer: "Karibu Builders", location: "Kilimani", start: "08:00", end: "16:30", agreed: 1200, paid: 1200, sunday: false, sector: "construction" },
  { id: 3, date: "2026-09-14", employer: "Maua Contractors", location: "Ngara", start: "08:00", end: "15:00", agreed: 1100, paid: 700, sunday: true, sector: "construction" },
];

const copy = {
  en: {
    hello: "Your work record",
    intro: "Log today’s shift. The totals update before you save.",
    saved: "Encrypted on this device",
    log: "Log a shift",
    records: "Records",
    incidents: "Incidents",
    dossier: "Haki Dossier",
    employer: "Employer or contractor",
    site: "Work site",
    start: "Start time",
    end: "End time",
    agreed: "Agreed pay",
    paid: "Amount received",
    rest: "Sunday or public holiday",
    save: "Save shift record",
    shortfall: "Wage shortfall",
    overtime: "Overtime due",
    total: "Total indicated claim",
    recent: "Recent records",
    viewAll: "View ledger",
    private: "Zero-Knowledge Vault",
    privateText: "Sensitive pay & incident notes are encrypted on-device with AES-GCM-256. Nothing unencrypted leaves this browser.",
    incidentTitle: "Record what happened",
    incidentText: "Capture an injury, dismissal, wage withholding, or maternity discrimination while details are fresh.",
    startIncident: "Start incident record",
    dossierText: "Compile your shifts, calculations, and evidence into one indexed dispute package.",
    build: "Build dossier preview",
    sector: "Work sector",
  },
  sw: {
    hello: "Rekodi yako ya kazi",
    intro: "Weka zamu ya leo. Jumla zinajihesabu kabla uhifadhi.",
    saved: "Imelindwa kwa simu hii",
    log: "Weka zamu",
    records: "Rekodi",
    incidents: "Matukio",
    dossier: "Jalada la Haki",
    employer: "Mwajiri au kontrakta",
    site: "Mahali pa kazi",
    start: "Saa ya kuanza",
    end: "Saa ya kumaliza",
    agreed: "Malipo mliyokubaliana",
    paid: "Kiasi ulicholipwa",
    rest: "Jumapili au sikukuu",
    save: "Hifadhi rekodi ya zamu",
    shortfall: "Upungufu wa mshahara",
    overtime: "Malipo ya saa za ziada",
    total: "Jumla inayodaiwa",
    recent: "Rekodi za hivi karibuni",
    viewAll: "Fungua leja",
    private: "Jalada Linalolindwa (AES-GCM)",
    privateText: "Rekodi zako za mshahara zimefichwa kisheria kwa ufunguo wako. Hakuna kinachotumwa mtandaoni.",
    incidentTitle: "Andika kilichotokea",
    incidentText: "Hifadhi jeraha, kufukuzwa, kuzuiwa mshahara, au ubaguzi wa uzazi kabla hujasahau.",
    startIncident: "Anza rekodi ya tukio",
    dossierText: "Kusanya zamu, hesabu na ushahidi wako katika jalada moja lenye mpangilio.",
    build: "Tengeneza hakikisho la jalada",
    sector: "Sekta ya kazi",
  },
};

const money = (value: number) => `KSh ${Math.round(value).toLocaleString("en-KE")}`;

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "sw">("en");
  const [active, setActive] = useState("home");
  const [savedPulse, setSavedPulse] = useState(false);
  const [toastMessage, setToastMessage] = useState("Shift saved to your device");

  // Shifts, Incidents, Evidence
  const [shifts, setShifts] = useState<StoredShift[]>(seedShifts);
  const [incidents, setIncidents] = useState<StoredIncident[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceAttachment[]>([]);

  // Shift Form State
  const [form, setForm] = useState({
    employer: "",
    location: "",
    date: "2026-09-20",
    start: "08:00",
    end: "17:30",
    agreed: "1200",
    paid: "1000",
    sunday: false,
    sector: "construction" as KenyanSector,
  });

  // Attached evidence for current shift being entered
  const [shiftAttachedEvidence, setShiftAttachedEvidence] = useState<EvidenceAttachment[]>([]);

  // Incident Form State
  const [incidentType, setIncidentType] = useState<"injury" | "wages" | "maternity" | "">("");
  const [incidentDate, setIncidentDate] = useState("2026-09-20");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentAttachedEvidence, setIncidentAttachedEvidence] = useState<EvidenceAttachment[]>([]);

  // Modals & Drawers
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState<"shift" | "incident">("shift");
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isFeaturePhoneOpen, setIsFeaturePhoneOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedAttachmentForViewer, setSelectedAttachmentForViewer] = useState<EvidenceAttachment | null>(null);

  // Vault Encryption State
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [isVaultConfigured, setIsVaultConfigured] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(false);

  const t = copy[lang];

  // Live Statutory Audit using Sector Rules Engine
  const auditResult: ShiftAuditResult = useMemo(
    () =>
      calculateSectorAudit(
        form.sector,
        Number(form.agreed) || 0,
        Number(form.paid) || 0,
        form.start,
        form.end,
        form.sunday
      ),
    [form]
  );

  // Hydrate Data on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // 1. Vault Meta
        const meta = await getVaultMetadata();
        if (meta && isMounted) {
          setIsVaultConfigured(meta.isPinEnabled);
          setIsVaultLocked(meta.isPinEnabled && !vaultKey);
        }

        // 2. Shifts from IndexedDB (fallback to localStorage or seed)
        const dbShifts = await getAllShifts();
        if (isMounted) {
          if (dbShifts && dbShifts.length > 0) {
            setShifts(dbShifts);
          } else {
            const stored = window.localStorage.getItem("fairwork-pulse-shifts");
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                setShifts(parsed);
                // Backfill to IndexedDB
                for (const s of parsed) {
                  await saveShift(s);
                }
              } catch {}
            } else {
              for (const s of seedShifts) {
                await saveShift(s);
              }
            }
          }
        }

        // 3. Incidents
        const dbIncidents = await getAllIncidents();
        if (isMounted && dbIncidents) {
          setIncidents(dbIncidents);
        }

        // 4. Evidence
        const dbEvidence = await getAllEvidence();
        if (isMounted && dbEvidence) {
          setEvidenceList(dbEvidence);
        }

        // 5. Query param screen
        const requested = new URLSearchParams(window.location.search).get("screen") || "home";
        if (["home", "records", "incidents", "dossier", "regulator"].includes(requested) && isMounted) {
          setActive(requested);
        }
      } catch (err) {
        console.error("Hydration error:", err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [vaultKey]);

  function navigate(id: string) {
    setActive(id);
    setIncidentType("");
    const url = id === "home" ? window.location.pathname : `${window.location.pathname}?screen=${id}`;
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message: string) {
    setToastMessage(message);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 2400);
  }

  // Vault Security Handlers
  async function handleSetupPin(pin: string): Promise<boolean> {
    try {
      const salt = generateSalt();
      const key = await deriveKeyFromPin(pin, salt);
      const verifyPayload = await createVaultVerificationToken(key);

      await saveVaultMetadata({
        id: "primary",
        saltBase64: bufferToBase64(salt),
        verifyTokenPayload: verifyPayload,
        isPinEnabled: true,
        createdAt: new Date().toISOString(),
      });

      setVaultKey(key);
      setIsVaultConfigured(true);
      setIsVaultLocked(false);
      showToast("Encrypted Vault Configured with Master PIN");
      return true;
    } catch {
      return false;
    }
  }

  async function handleUnlockVault(pin: string): Promise<boolean> {
    try {
      const meta = await getVaultMetadata();
      if (!meta) return false;

      const salt = base64ToBuffer(meta.saltBase64);
      const key = await deriveKeyFromPin(pin, salt);
      const isValid = await verifyVaultKey(key, meta.verifyTokenPayload);

      if (isValid) {
        setVaultKey(key);
        setIsVaultLocked(false);
        showToast("Vault Decrypted & Unlocked");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Save Shift Record
  async function submitShift(e: FormEvent) {
    e.preventDefault();

    const shiftId = Date.now();
    const evidenceIds = shiftAttachedEvidence.map((ev) => ev.id);

    let ciphertextPayload = undefined;
    let isEncrypted = false;

    if (vaultKey) {
      ciphertextPayload = await encryptData(
        {
          employer: form.employer || "Employer not named",
          location: form.location || "Site not named",
          agreed: Number(form.agreed),
          paid: Number(form.paid),
          audit: auditResult,
        },
        vaultKey
      );
      isEncrypted = true;
    }

    const next: StoredShift = {
      id: shiftId,
      date: form.date,
      employer: form.employer || "Employer not named",
      location: form.location || "Site not named",
      start: form.start,
      end: form.end,
      agreed: Number(form.agreed),
      paid: Number(form.paid),
      sunday: form.sunday,
      sector: form.sector,
      evidenceIds,
      ciphertextPayload,
      isEncrypted,
    };

    // Update state & persist to IndexedDB
    const updated = [next, ...shifts];
    setShifts(updated);
    await saveShift(next);
    window.localStorage.setItem("fairwork-pulse-shifts", JSON.stringify(updated));

    // Clear attached evidence for this shift
    setShiftAttachedEvidence([]);
    showToast("Shift & payment proof saved to your device");
  }

  // Save Incident Record
  async function submitIncident(e: FormEvent) {
    e.preventDefault();
    if (!incidentType) return;

    const incidentId = Date.now();
    const evidenceIds = incidentAttachedEvidence.map((ev) => ev.id);

    let ciphertextPayload = undefined;
    let isEncrypted = false;

    if (vaultKey) {
      ciphertextPayload = await encryptData(
        {
          description: incidentDescription,
        },
        vaultKey
      );
      isEncrypted = true;
    }

    const newIncident: StoredIncident = {
      id: incidentId,
      date: incidentDate,
      category: incidentType,
      description: incidentDescription,
      evidenceIds,
      ciphertextPayload,
      isEncrypted,
      createdAt: new Date().toISOString(),
    };

    const updated = [newIncident, ...incidents];
    setIncidents(updated);
    await saveIncident(newIncident);

    setIncidentType("");
    setIncidentDescription("");
    setIncidentAttachedEvidence([]);
    showToast("Incident & evidence saved privately in vault");
  }

  // Total Owed across all stored shifts
  const totalOwed = shifts.reduce((sum, shift) => {
    const res = calculateSectorAudit(
      (shift.sector as KenyanSector) || "construction",
      shift.agreed,
      shift.paid,
      shift.start,
      shift.end,
      shift.sunday
    );
    return sum + res.totalClaim;
  }, 0);

  const totalOvertimeHours = shifts.reduce((sum, shift) => {
    const res = calculateSectorAudit(
      (shift.sector as KenyanSector) || "construction",
      shift.agreed,
      shift.paid,
      shift.start,
      shift.end,
      shift.sunday
    );
    return sum + res.overtimeHours;
  }, 0);

  const nav = [
    ["home", Home, t.log],
    ["records", ReceiptText, t.records],
    ["incidents", HeartPulse, t.incidents],
    ["dossier", FolderLock, t.dossier],
  ] as const;

  const mobileNav = [
    ["home", Home, "Home"],
    ["records", ReceiptText, t.records],
    ["quick-log", Plus, t.log],
    ["incidents", HeartPulse, t.incidents],
    ["dossier", FolderLock, t.dossier],
  ] as const;

  return (
    <main className="app-shell">
      {/* Top Header */}
      <header className="topbar">
        <button
          className="profile-greeting"
          type="button"
          onClick={() => setIsVaultModalOpen(true)}
          aria-label="Worker profile and security settings"
        >
          <span className="profile-photo">AM</span>
          <span>
            <small>Welcome back,</small>
            <strong className="flex items-center gap-1.5">
              Amina M.
              {isVaultConfigured && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold flex items-center gap-0.5 ${isVaultLocked ? "text-amber-800 bg-amber-100" : "text-emerald-700 bg-emerald-100/80"}`}>
                  {isVaultLocked ? <Lock size={10} /> : <Unlock size={10} />} {isVaultLocked ? "Locked" : "AES-256"}
                </span>
              )}
            </strong>
          </span>
        </button>

        <div className="header-actions">
          {/* Cloud Sync & Backup Trigger */}
          <Button
            variant="iosTinted"
            size="iosIcon"
            className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            onClick={() => setIsSyncModalOpen(true)}
            aria-label="Cloud Sync & Backup"
            title="Supabase Cloud Backup"
          >
            <Cloud size={18} />
          </Button>

          {/* Quick AI Rights Assistant Trigger */}
          <Button
            variant="iosTinted"
            size="iosIcon"
            className="text-blue-600 bg-blue-50"
            onClick={() => setIsAssistantOpen(true)}
            aria-label="AI Legal Assistant"
            title="Ask AI Legal Assistant"
          >
            <Sparkles size={18} />
          </Button>

          {/* Feature Phone Simulator Trigger */}
          <Button
            variant="iosTinted"
            size="iosIcon"
            className="text-amber-700 bg-amber-50"
            onClick={() => setIsFeaturePhoneOpen(true)}
            aria-label="Feature Phone Intake (USSD/WhatsApp)"
            title="Kitochi USSD & WhatsApp Bot"
          >
            <Smartphone size={18} />
          </Button>

          {/* Language Toggle */}
          <Button
            variant="iosTinted"
            size="iosIcon"
            className="language"
            onClick={() => setLang(lang === "en" ? "sw" : "en")}
            aria-label="Change language"
          >
            <Languages size={18} />
            <span>{lang === "en" ? "Kiswahili" : "English"}</span>
          </Button>

          {/* Notifications */}
          <Button variant="iosTinted" size="iosIcon" className="notification" aria-label="Notifications">
            <Bell size={19} />
            <i />
          </Button>
        </div>
      </header>

      <div className="desktop-grid" id="top">
        {/* Sidebar Nav */}
        <aside className="side-nav" aria-label="Primary navigation">
          <div className="worker-card">
            <div className="worker-avatar">AM</div>
            <div>
              <strong>Amina M.</strong>
              <span>Construction & Casual · Nairobi</span>
            </div>
          </div>
          <nav>
            {nav.map(([id, Icon, label]) => (
              <Button
                type="button"
                variant="iosPlain"
                key={id}
                className={active === id ? "nav-item active" : "nav-item"}
                aria-current={active === id ? "page" : undefined}
                onClick={() => navigate(id)}
              >
                <Icon size={20} />
                <span>{label}</span>
                {id === "incidents" && incidents.length > 0 && <i>{incidents.length}</i>}
              </Button>
            ))}
          </nav>

          <div className="offline-note">
            <ShieldCheck size={20} />
            <strong>{t.private}</strong>
            <p>{t.privateText}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 space-y-1.5">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="w-full py-2 px-3 text-left rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center justify-between border border-emerald-100 bg-emerald-50/50"
            >
              <span className="flex items-center gap-2">
                <Cloud size={15} className="text-emerald-600" /> Cloud Backup (Supabase)
              </span>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            <button
              onClick={() => navigate("regulator")}
              className="w-full py-2 px-3 text-left rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Building2 size={15} className="text-purple-600" /> Regulator & Union View
              </span>
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </div>
        </aside>

        {/* Main Column */}
        <section className={active === "home" ? "main-column" : "main-column show-secondary"}>
          {active !== "home" && (
            <section className="secondary-screen">
              {/* Secondary Navigation Bar */}
              <div className="secondary-nav">
                <Button variant="iosPlain" onClick={() => setActive("home")}>
                  <ArrowLeft /> Back
                </Button>
                <span>
                  {active === "records"
                    ? t.records
                    : active === "incidents"
                    ? t.incidents
                    : active === "regulator"
                    ? "Union & Regulator Monitor"
                    : t.dossier}
                </span>
                <span />
              </div>

              {/* SCREEN 1: RECORDS LEDGER */}
              {active === "records" && (
                <>
                  <div className="secondary-title">
                    <div>
                      <h1>{t.records}</h1>
                      <p>Contemporaneous shifts stored in your device vault.</p>
                    </div>
                    <Button
                      variant="iosTinted"
                      size="iosIcon"
                      onClick={() => setActive("home")}
                      aria-label="Add a shift"
                    >
                      <Plus />
                    </Button>
                  </div>

                  <div className="ios-summary">
                    <span>
                      <b>{shifts.length}</b> shifts
                    </span>
                    <span>
                      <b>{money(totalOwed)}</b> indicated due
                    </span>
                  </div>

                  <div className="ledger full-ledger">
                    {shifts.map((shift) => {
                      const item = calculateSectorAudit(
                        (shift.sector as KenyanSector) || "construction",
                        shift.agreed,
                        shift.paid,
                        shift.start,
                        shift.end,
                        shift.sunday
                      );
                      const hasProof = shift.evidenceIds && shift.evidenceIds.length > 0;

                      return (
                        <Button variant="iosPlain" className="ledger-row" key={shift.id}>
                          <span className="ledger-date">
                            <b>{new Date(`${shift.date}T12:00:00`).getDate()}</b>
                            <small>
                              {new Date(`${shift.date}T12:00:00`)
                                .toLocaleString("en", { month: "short" })
                                .toUpperCase()}
                            </small>
                          </span>
                          <span className="ledger-main">
                            <strong className="flex items-center gap-1.5">
                              {shift.employer}
                              {hasProof && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                                  Proof
                                </span>
                              )}
                            </strong>
                            <small>
                              {shift.location} · {shift.start}–{shift.end}
                            </small>
                          </span>
                          <span className="ledger-status">
                            <strong className={item.totalClaim ? "danger" : "paid"}>
                              {item.totalClaim ? `${money(item.totalClaim)} due` : "Paid in full"}
                            </strong>
                            <small>{item.overtimeHours.toFixed(1)} OT hrs</small>
                          </span>
                          <ChevronRight />
                        </Button>
                      );
                    })}
                  </div>

                  <Button variant="iosPrimary" className="screen-action" onClick={() => setActive("home")}>
                    <Plus /> Log another shift
                  </Button>
                </>
              )}

              {/* SCREEN 2: INCIDENTS */}
              {active === "incidents" && (
                <>
                  <div className="secondary-title">
                    <div>
                      <h1>{t.incidentTitle}</h1>
                      <p>Document workplace violations, injuries, or withheld pay.</p>
                    </div>
                  </div>

                  <div className="incident-choices">
                    <Button
                      variant="iosPlain"
                      className={incidentType === "injury" ? "choice selected" : "choice"}
                      onClick={() => setIncidentType("injury")}
                    >
                      <span className="choice-icon red">
                        <HeartPulse />
                      </span>
                      <span>
                        <strong>Workplace injury (WIBA 2007)</strong>
                        <small>Mtu akiumia · medical bills, accident notice, witnesses</small>
                      </span>
                      <ChevronRight />
                    </Button>

                    <Button
                      variant="iosPlain"
                      className={incidentType === "wages" ? "choice selected" : "choice"}
                      onClick={() => setIncidentType("wages")}
                    >
                      <span className="choice-icon orange">
                        <Banknote />
                      </span>
                      <span>
                        <strong>Wages withheld or deducted</strong>
                        <small>Unlawful salary cut, unpaid overtime, delay</small>
                      </span>
                      <ChevronRight />
                    </Button>

                    <Button
                      variant="iosPlain"
                      className={incidentType === "maternity" ? "choice selected" : "choice"}
                      onClick={() => setIncidentType("maternity")}
                    >
                      <span className="choice-icon purple">
                        <Baby />
                      </span>
                      <span>
                        <strong>Maternity discrimination</strong>
                        <small>Pregnancy dismissal, denial of 3-month statutory leave</small>
                      </span>
                      <ChevronRight />
                    </Button>
                  </div>

                  {incidentType && (
                    <form className="incident-form" onSubmit={submitIncident}>
                      <label>
                        <span>When did it happen?</span>
                        <input
                          type="date"
                          value={incidentDate}
                          onChange={(e) => setIncidentDate(e.target.value)}
                        />
                      </label>
                      <label>
                        <span>What happened? (Facts & Witnesses)</span>
                        <textarea
                          value={incidentDescription}
                          onChange={(e) => setIncidentDescription(e.target.value)}
                          placeholder="State what occurred, supervisor names, and location..."
                          required
                        />
                      </label>

                      {/* Attached Proofs for Incident */}
                      {incidentAttachedEvidence.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-gray-700">Attached Proofs:</span>
                          <div className="flex flex-wrap gap-2">
                            {incidentAttachedEvidence.map((att) => (
                              <div
                                key={att.id}
                                onClick={() => setSelectedAttachmentForViewer(att)}
                                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-blue-100 cursor-pointer hover:bg-blue-100/70 transition-all group"
                              >
                                {att.dataUrl?.startsWith("data:image/") ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={att.dataUrl}
                                    alt={att.fileName}
                                    className="w-5 h-5 rounded object-cover border border-blue-200"
                                  />
                                ) : (
                                  <FileText size={14} />
                                )}
                                <span className="max-w-[130px] truncate">{att.fileName}</span>
                                <Eye size={12} className="text-blue-500 opacity-60 group-hover:opacity-100" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="iosTinted"
                        className="evidence-button"
                        onClick={() => {
                          setEvidenceTarget("incident");
                          setIsEvidenceModalOpen(true);
                        }}
                      >
                        <Camera /> Add photo or medical receipt
                      </Button>

                      <Button type="submit" variant="iosPrimary">
                        Save incident to encrypted vault
                      </Button>
                    </form>
                  )}

                  {/* Past Logged Incidents */}
                  {incidents.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-bold text-gray-800">
                        Past Incident Records ({incidents.length})
                      </h3>
                      {incidents.map((inc) => (
                        <div
                          key={inc.id}
                          className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900 uppercase">
                              {inc.category}
                            </span>
                            <span className="text-[11px] text-gray-400">{inc.date}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{inc.description}</p>
                          {inc.evidenceIds && inc.evidenceIds.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                              <Check size={10} /> {inc.evidenceIds.length} evidence attachment(s)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SCREEN 3: REGULATOR / UNION MONITOR */}
              {active === "regulator" && (
                <RegulatorDashboard onBack={() => setActive("home")} />
              )}

              {/* SCREEN 4: HAKI DOSSIER PREVIEW */}
              {active === "dossier" && (
                <>
                  <div className="secondary-title">
                    <div>
                      <h1>{t.dossier}</h1>
                      <p>Complete dispute evidence package with statutory audit chain.</p>
                    </div>
                    <span className="ready-badge">
                      <Check /> Ready
                    </span>
                  </div>

                  <article className="dossier-preview">
                    <header>
                      <div className="dossier-logo">
                        <Scale />
                      </div>
                      <div>
                        <strong>Fairwork Pulse</strong>
                        <span>Haki Dossier · Tamper-Evident Dispute Brief</span>
                      </div>
                    </header>

                    <div className="dossier-person">
                      <span>Complainant</span>
                      <b>Amina M. · Casual Worker</b>
                      <small>Nairobi, Kenya · Contiguous Work Ledger</small>
                    </div>

                    <div className="dossier-total">
                      <span>Indicative amount outstanding</span>
                      <strong>{money(totalOwed)}</strong>
                      <small>
                        Wage deficit plus calculated overtime ({totalOvertimeHours.toFixed(1)} OT hrs)
                      </small>
                    </div>

                    <ul>
                      <li>
                        <span>Work records</span>
                        <b>{shifts.length} attached</b>
                      </li>
                      <li>
                        <span>Reported incidents</span>
                        <b>{incidents.length} documented</b>
                      </li>
                      <li>
                        <span>Indexed evidence & receipts</span>
                        <b>{evidenceList.length} files (SHA-256 bound)</b>
                      </li>
                      <li>
                        <span>Primary sector rules</span>
                        <b>{SECTOR_CONFIGS[form.sector].name}</b>
                      </li>
                      <li>
                        <span>Governing statutes</span>
                        <b>Employment Act 2007 + WIBA 2007</b>
                      </li>
                    </ul>

                    {/* Attached Evidence Hash Chain Table */}
                    {evidenceList.length > 0 && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          Evidence Chain of Custody (SHA-256 Verified)
                        </h4>
                        <div className="space-y-2">
                          {evidenceList.map((ev, idx) => (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedAttachmentForViewer(ev)}
                              className="p-2.5 rounded-xl bg-white border border-gray-200 text-[11px] space-y-1.5 cursor-pointer hover:border-blue-300 hover:shadow-xs transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  {ev.dataUrl?.startsWith("data:image/") ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={ev.dataUrl}
                                      alt={ev.fileName}
                                      className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                      <FileText size={16} className="text-gray-500" />
                                    </div>
                                  )}
                                  <div className="truncate max-w-[180px]">
                                    <span className="font-semibold text-gray-800 block truncate">
                                      #{idx + 1}. {ev.fileName}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {(ev.fileSize / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                </div>
                                <Eye size={15} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                  {ev.paymentType || "Evidence"}
                                </span>
                                <code className="text-[9px] font-mono text-gray-500 truncate max-w-[200px]">
                                  SHA: {ev.sha256Hash}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p>
                      Calculations are generated contemporaneously in accordance with the Employment Act
                      2007 and the Regulation of Wages (General) Order. Admissible for conciliation before
                      Sub-County Labour Officers or trade union representatives.
                    </p>
                  </article>

                  <Button variant="iosPrimary" className="screen-action" onClick={() => window.print()}>
                    <Download /> Export & Print Haki Dossier (PDF)
                  </Button>
                  <Button
                    variant="iosTinted"
                    className="screen-action mt-2 text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70"
                    onClick={() => setIsSyncModalOpen(true)}
                  >
                    <Cloud /> Backup Dossier to Cloud (Supabase)
                  </Button>
                  <Button
                    variant="iosPlain"
                    className="source-link"
                    onClick={() => showToast("Statutory citations verified against Kenya Law")}
                  >
                    <FileText /> Statutory Citation Register Attached
                  </Button>
                </>
              )}
            </section>
          )}

          {/* HOME SCREEN CONTENT */}
          <div className="page-heading">
            <div>
              <h1>{t.hello}</h1>
              <p>{t.intro}</p>
            </div>
            <div className="date-chip">
              <CalendarDays size={18} />
              <span>Sun, 20 Sep</span>
            </div>
          </div>

          {/* Balance / Summary Card */}
          <section className="pulse-card" aria-label="Work record summary">
            <div className="pulse-card-top">
              <span>
                <ShieldCheck size={16} />{" "}
                {isVaultConfigured ? "Zero-Knowledge Encrypted" : "Private device ledger"}
              </span>
              <strong className="tracking-wider">FAIRWORK</strong>
            </div>
            <p>Indicated amount due</p>
            <div className="pulse-balance">
              <strong>{money(totalOwed)}</strong>
              <Eye size={21} />
            </div>
            <div className="pulse-card-meta">
              <span>
                SHIFT RECORDS<b>{shifts.length}</b>
              </span>
              <span>
                ATTACHMENTS<b>{evidenceList.length} files</b>
              </span>
              <span>
                STATUS<b>{totalOwed > 0 ? "Claim due" : "Up to date"}</b>
              </span>
            </div>
          </section>

          {/* Quick Actions Row */}
          <div className="quick-actions" aria-label="Quick actions">
            <Button type="button" variant="iosPlain" onClick={() => navigate("incidents")}>
              <span>
                <ArrowDownLeft />
              </span>
              Report incident
            </Button>
            <Button type="button" variant="iosPlain" onClick={() => navigate("dossier")}>
              <span>
                <ArrowUpRight />
              </span>
              Haki dossier
            </Button>
            <Button
              type="button"
              variant="iosPlain"
              className="quick-add"
              onClick={() => document.querySelector(".shift-form")?.scrollIntoView({ behavior: "smooth" })}
              aria-label="Log a shift"
            >
              <Plus />
            </Button>
          </div>

          {/* Shift Logging Form */}
          <form className="shift-form" onSubmit={submitShift}>
            <div className="form-title">
              <div className="title-icon">
                <BriefcaseBusiness size={23} />
              </div>
              <div>
                <h2>{t.log}</h2>
                <p>About 30 seconds · works offline</p>
              </div>
              <span className="form-step">NEW RECORD</span>
            </div>

            <div className="fields">
              {/* Sector Selector */}
              <label className="span-2">
                <span>{t.sector}</span>
                <select
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value as KenyanSector })}
                  className="w-full h-11 bg-transparent text-right font-semibold text-gray-900 focus:outline-none"
                >
                  <option value="construction">Construction & Artisans (Ujenzi)</option>
                  <option value="agriculture">Agriculture & Tea Picking (Kilimo)</option>
                  <option value="domestic">Domestic Workers (Wafanyakazi wa Nyumbani)</option>
                  <option value="gig_delivery">Gig Delivery & Boda Boda</option>
                </select>
              </label>

              <label className="span-2">
                <span>{t.employer}</span>
                <input
                  value={form.employer}
                  onChange={(e) => setForm({ ...form, employer: e.target.value })}
                  placeholder="e.g. Karibu Builders or contractor"
                />
              </label>

              <label>
                <span>{t.site}</span>
                <div className="input-icon">
                  <MapPin size={17} />
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Area / town (e.g. Kilimani)"
                  />
                </div>
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <label>
                <span>{t.start}</span>
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </label>

              <label>
                <span>{t.end}</span>
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </label>

              <label>
                <span>{t.agreed}</span>
                <div className="currency-input">
                  <b>KSh</b>
                  <input
                    inputMode="numeric"
                    value={form.agreed}
                    onChange={(e) => setForm({ ...form, agreed: e.target.value })}
                  />
                </div>
              </label>

              <label>
                <span>{t.paid}</span>
                <div className="currency-input">
                  <b>KSh</b>
                  <input
                    inputMode="numeric"
                    value={form.paid}
                    onChange={(e) => setForm({ ...form, paid: e.target.value })}
                  />
                </div>
              </label>
            </div>

            {/* Attached Payment Screenshots / Proofs */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="iosTinted"
                  size="sm"
                  onClick={() => {
                    setEvidenceTarget("shift");
                    setIsEvidenceModalOpen(true);
                  }}
                  className="text-xs font-semibold text-blue-700 bg-blue-100/70 hover:bg-blue-200/70 h-8 px-3 rounded-full flex items-center gap-1.5"
                >
                  <Camera size={14} /> Attach Payment Proof (M-Pesa / Receipt)
                </Button>

                {shiftAttachedEvidence.length > 0 && (
                  <span className="text-xs text-emerald-700 font-medium">
                    {shiftAttachedEvidence.length} file attached
                  </span>
                )}
              </div>

              {shiftAttachedEvidence.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {shiftAttachedEvidence.map((att) => (
                    <div
                      key={att.id}
                      onClick={() => setSelectedAttachmentForViewer(att)}
                      className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl text-xs font-medium border border-gray-200 shadow-xs cursor-pointer hover:border-blue-300 transition-all group"
                    >
                      {att.dataUrl?.startsWith("data:image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={att.dataUrl}
                          alt={att.fileName}
                          className="w-6 h-6 rounded-md object-cover border border-gray-100"
                        />
                      ) : (
                        <FileText size={15} className="text-gray-500" />
                      )}
                      <div className="truncate max-w-[120px]">
                        <span className="truncate block font-semibold text-gray-800">
                          {att.fileName}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-blue-600 block">
                          {att.paymentType || "Payment"}
                        </span>
                      </div>
                      <Eye size={13} className="text-gray-400 group-hover:text-blue-600 ml-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-footer">
              <label className="check-line">
                <input
                  type="checkbox"
                  checked={form.sunday}
                  onChange={(e) => setForm({ ...form, sunday: e.target.checked })}
                />
                <span>
                  <Check size={15} />
                </span>
                {t.rest} (Double Time 2.0×)
              </label>
              <Button variant="iosPrimary" className="save-button" type="submit">
                {savedPulse ? (
                  <>
                    <Check size={20} /> Saved
                  </>
                ) : (
                  <>
                    <Plus size={20} /> {t.save}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Live Statutory Audit Strip */}
          <section className="audit-strip" aria-live="polite">
            <div className="audit-intro">
              <span className="audit-stamp">LIVE STATUTORY AUDIT</span>
              <p>{auditResult.totalHours.toFixed(1)} hrs recorded</p>
            </div>
            <div>
              <span>{t.shortfall}</span>
              <strong className={auditResult.wageDeficit ? "danger" : "ok"}>
                {money(auditResult.wageDeficit)}
              </strong>
              <small>Employment Act §§17–19</small>
            </div>
            <div>
              <span>{t.overtime}</span>
              <strong>{money(auditResult.overtimePayDue)}</strong>
              <small>
                {auditResult.overtimeHours.toFixed(1)} hrs × {form.sunday ? "2.0" : "1.5"}
              </small>
            </div>
            <div className="claim-total">
              <span>{t.total}</span>
              <strong>{money(auditResult.totalClaim)}</strong>
              <small>Indicative statutory claim</small>
            </div>
          </section>

          {/* Recent Records Ledger */}
          <section className="records-section">
            <div className="section-heading">
              <div>
                <h2>{t.recent}</h2>
                <p>{shifts.length} records in your device vault</p>
              </div>
              <Button variant="iosPlain" onClick={() => setActive("records")}>
                {t.viewAll}
                <ArrowRight size={18} />
              </Button>
            </div>
            <div className="ledger">
              {shifts.slice(0, 3).map((shift) => {
                const item = calculateSectorAudit(
                  (shift.sector as KenyanSector) || "construction",
                  shift.agreed,
                  shift.paid,
                  shift.start,
                  shift.end,
                  shift.sunday
                );
                return (
                  <Button variant="iosPlain" className="ledger-row" key={shift.id}>
                    <span className="ledger-date">
                      <b>{new Date(`${shift.date}T12:00:00`).getDate()}</b>
                      <small>
                        {new Date(`${shift.date}T12:00:00`)
                          .toLocaleString("en", { month: "short" })
                          .toUpperCase()}
                      </small>
                    </span>
                    <span className="ledger-main">
                      <strong>{shift.employer}</strong>
                      <small>
                        <MapPin size={13} />
                        {shift.location} · {shift.start}–{shift.end}
                      </small>
                    </span>
                    <span className="ledger-status">
                      <strong className={item.totalClaim ? "danger" : "paid"}>
                        {item.totalClaim ? `${money(item.totalClaim)} due` : "Paid in full"}
                      </strong>
                      <small>{item.overtimeHours.toFixed(1)} overtime hrs</small>
                    </span>
                    <ChevronRight size={19} />
                  </Button>
                );
              })}
            </div>
          </section>
        </section>

        {/* Right Rail (Desktop Only) */}
        <aside className="right-rail">
          <section className="claim-card">
            <div className="claim-top">
              <FileCheck2 size={22} />
              <span>VAULT LEDGER</span>
            </div>
            <p>Estimated amount recorded as outstanding</p>
            <strong>{money(totalOwed)}</strong>
            <div className="claim-meta">
              <span>
                <b>{shifts.length}</b> shifts
              </span>
              <span>
                <b>{incidents.length}</b> incidents
              </span>
              <span>
                <b>{evidenceList.length}</b> proofs
              </span>
            </div>
          </section>

          {/* Dossier Card */}
          <section className="action-panel dossier-panel">
            <div className="action-icon">
              <FileText size={24} />
            </div>
            <h2>{t.dossier}</h2>
            <p>{t.dossierText}</p>
            <ul>
              <li>
                <Check size={15} /> Sector wage order audit
              </li>
              <li>
                <Check size={15} /> Statutory legal references
              </li>
              <li>
                <Check size={15} /> SHA-256 verified evidence
              </li>
            </ul>
            <Button variant="secondary" onClick={() => setActive("dossier")}>
              {t.build}
              <ArrowRight size={18} />
            </Button>
          </section>

          {/* Incident Card */}
          <section className="action-panel incident-panel">
            <div className="action-icon">
              <AlertTriangle size={24} />
            </div>
            <h2>{t.incidentTitle}</h2>
            <p>{t.incidentText}</p>
            <Button variant="outline" onClick={() => setActive("incidents")}>
              {t.startIncident}
              <ChevronRight size={18} />
            </Button>
          </section>

          {/* Regional Regulator Link */}
          <div className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
            <div>
              <strong className="text-xs text-gray-800 block">Union / Regulator Monitor</strong>
              <span className="text-[10px] text-gray-500">Sub-county risk telemetry</span>
            </div>
            <Button
              variant="iosTinted"
              size="sm"
              onClick={() => setActive("regulator")}
              className="text-xs h-8 px-3"
            >
              Open
            </Button>
          </div>

          <p className="legal-note">
            <ShieldCheck size={16} /> Calculations are statutory guidance under Kenyan law, not legal
            representation.
          </p>
        </aside>
      </div>

      {/* Floating Bottom Navigation */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNav.map(([id, Icon, label]) => (
          <Button
            type="button"
            variant="iosPlain"
            key={id}
            className={`${active === id ? "active" : ""} ${id === "quick-log" ? "nav-primary" : ""}`}
            aria-current={active === id ? "page" : undefined}
            onClick={() => {
              if (id === "quick-log") {
                navigate("home");
                window.setTimeout(
                  () => document.querySelector(".shift-form")?.scrollIntoView({ behavior: "smooth" }),
                  30
                );
              } else navigate(id);
            }}
          >
            <span className="nav-icon">
              <Icon size={id === "quick-log" ? 25 : 21} />
            </span>
            <span>{label}</span>
          </Button>
        ))}
      </nav>

      {/* Persistent Toast */}
      <div className={savedPulse ? "toast show" : "toast"}>
        <Check size={18} />
        <span>{toastMessage}</span>
      </div>

      {/* Evidence & Payment Screenshot Attachment Modal */}
      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        parentType={evidenceTarget}
        initialTypeHint="payment"
        onAttachmentSaved={(saved) => {
          if (evidenceTarget === "shift") {
            setShiftAttachedEvidence((prev) => [...prev, saved]);
          } else {
            setIncidentAttachedEvidence((prev) => [...prev, saved]);
          }
          setEvidenceList((prev) => [saved, ...prev]);
          showToast(`Attached ${saved.fileName} (${saved.paymentType}) with SHA-256`);
        }}
      />

      {/* Vault Master PIN Modal */}
      <VaultLockModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        isConfigured={isVaultConfigured}
        onUnlock={handleUnlockVault}
        onSetupPin={handleSetupPin}
      />

      {/* AI Legal Rights Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        lang={lang}
      />

      {/* Feature-Phone Kitochi Simulator */}
      <FeaturePhoneModal
        isOpen={isFeaturePhoneOpen}
        onClose={() => setIsFeaturePhoneOpen(false)}
        onShiftLoggedFromUssd={(ussdShift) => {
          const newShift: StoredShift = {
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
            employer: ussdShift.employer,
            location: ussdShift.location,
            start: ussdShift.start,
            end: ussdShift.end,
            agreed: ussdShift.agreed,
            paid: ussdShift.paid,
            sunday: false,
            sector: "construction",
          };
          setShifts((prev) => [newShift, ...prev]);
          saveShift(newShift);
          showToast("Shift logged via USSD gateway *384*2026#");
        }}
      />

      {/* Cloud Sync to Supabase Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isVaultConfigured={isVaultConfigured}
        shiftCount={shifts.length}
        incidentCount={incidents.length}
        evidenceCount={evidenceList.length}
        onSyncComplete={(res) => {
          showToast(`Backed up ${res.shifts} shifts, ${res.incidents} incidents to Supabase`);
        }}
      />

      {/* Lightbox / Cryptographic Evidence Viewer Modal */}
      <ImageViewerModal
        attachment={selectedAttachmentForViewer}
        isOpen={!!selectedAttachmentForViewer}
        onClose={() => setSelectedAttachmentForViewer(null)}
      />
    </main>
  );
}
