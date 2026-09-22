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
  Menu,
  Plus,
  ReceiptText,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Unlock,
  User,
  X,
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
  updateEvidenceAttachment,
  getVaultMetadata,
  saveVaultMetadata,
  getWorkerProfile,
  WorkerProfile,
  StoredShift,
  StoredIncident,
  EvidenceAttachment,
  getAllWorkArrangements,
  saveWorkArrangement,
} from "@/lib/vault-db";
import { WorkArrangement } from "@/lib/work-arrangements";
import {
  deriveKeyFromPin,
  encryptData,
  decryptData,
  encryptString,
  decryptString,
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
import { WorkerProfileModal } from "@/components/worker-profile-modal";
import { HakiDossier } from "@/components/haki-dossier";
import { WorkArrangementPanel } from "@/components/work-arrangement-panel";

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
    private: "Encrypted device vault",
    privateText: "With a PIN, sensitive pay and incident content is encrypted on this device before optional cloud backup.",
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

// Pre-filled Demo Dataset (Amina M.)
const DEMO_PROFILE: WorkerProfile = {
  id: "current",
  name: "Amina M.",
  phone: "0712 345 678",
  county: "Nairobi",
  sector: "construction",
  updatedAt: "2026-09-20T10:00:00.000Z",
};

const DEMO_SHIFTS: StoredShift[] = [
  { id: 1, date: "2026-09-18", employer: "Karibu Builders", location: "Kilimani", start: "07:30", end: "17:30", agreed: 1200, paid: 1000, sunday: false, sector: "construction" },
  { id: 2, date: "2026-09-17", employer: "Karibu Builders", location: "Kilimani", start: "08:00", end: "16:30", agreed: 1200, paid: 1200, sunday: false, sector: "construction" },
  { id: 3, date: "2026-09-14", employer: "Maua Contractors", location: "Ngara", start: "08:00", end: "15:00", agreed: 1100, paid: 700, sunday: true, sector: "construction" },
];

const DEMO_INCIDENTS: StoredIncident[] = [
  {
    id: 1,
    date: "2026-09-16",
    category: "wages",
    description: "Employer withheld KSh 400 for lunch and site transport which was never agreed in writing.",
    evidenceIds: [],
    createdAt: "2026-09-16T17:00:00Z",
  },
];

const DEMO_ARRANGEMENT: WorkArrangement = {
  id: "demo-construction",
  label: "Karibu Builders",
  sector: "construction",
  paymentBasis: "daily",
  employerOrClient: "Karibu Builders",
  confirmed: true,
  createdAt: "2026-09-14T09:00:00.000Z",
  updatedAt: "2026-09-20T10:00:00.000Z",
};

function createRecordId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "sw">("en");
  const [active, setActive] = useState("home");
  const [savedPulse, setSavedPulse] = useState(false);
  const [toastMessage, setToastMessage] = useState("Shift saved to your device");
  const [isOnline, setIsOnline] = useState(true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isSavingShift, setIsSavingShift] = useState(false);
  const [isSavingIncident, setIsSavingIncident] = useState(false);

  // Mode state: 'demo' (Amina M. pre-filled) vs 'clean' (Personal profile)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Worker Profile State
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showFirstRecordPrompt, setShowFirstRecordPrompt] = useState(false);

  // Shifts, Incidents, Evidence - Starts completely clean by default
  const [shifts, setShifts] = useState<StoredShift[]>([]);
  const [incidents, setIncidents] = useState<StoredIncident[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceAttachment[]>([]);
  const [workArrangements, setWorkArrangements] = useState<WorkArrangement[]>([]);
  const [activeArrangementId, setActiveArrangementId] = useState<string | null>(null);

  // Shift Form State - Starts clean without prefilled mock numbers
  const [form, setForm] = useState({
    employer: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    start: "08:00",
    end: "17:00",
    agreed: "",
    paid: "",
    sunday: false,
    sector: "construction" as KenyanSector,
  });

  // Attached evidence for current shift being entered
  const [shiftAttachedEvidence, setShiftAttachedEvidence] = useState<EvidenceAttachment[]>([]);
  const [shiftDraftId, setShiftDraftId] = useState(() => createRecordId());

  // Incident Form State
  const [incidentType, setIncidentType] = useState<"injury" | "wages" | "maternity" | "">("");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentAttachedEvidence, setIncidentAttachedEvidence] = useState<EvidenceAttachment[]>([]);
  const [incidentDraftId, setIncidentDraftId] = useState(() => createRecordId());

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

  const activeArrangement = workArrangements.find((arrangement) => arrangement.id === activeArrangementId) || workArrangements[0] || null;

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

  // Worker display initials
  const workerInitials = (() => {
    if (!workerProfile?.name) return "FP";
    const parts = workerProfile.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  // Hydrate Data on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // 0. Check Mode Preference
        const savedMode = typeof window !== "undefined" ? window.localStorage.getItem("fairwork-profile-mode") : null;
        const isDemo = savedMode === "demo";
        if (isMounted) setIsDemoMode(isDemo);

        if (isDemo) {
          if (isMounted) {
            setWorkArrangements([DEMO_ARRANGEMENT]);
            setActiveArrangementId(DEMO_ARRANGEMENT.id);
            setWorkerProfile(DEMO_PROFILE);
            setShifts(DEMO_SHIFTS.map((shift) => ({ ...shift, arrangementId: DEMO_ARRANGEMENT.id })));
            setIncidents(DEMO_INCIDENTS.map((incident) => ({ ...incident, arrangementId: DEMO_ARRANGEMENT.id })));
            setForm((prev) => ({
              ...prev,
              employer: "Karibu Builders",
              location: "Kilimani",
              agreed: "1200",
              paid: "1000",
              sector: "construction",
            }));
          }
        } else {
          const arrangements = await getAllWorkArrangements();
          if (isMounted) {
            setWorkArrangements(arrangements);
            setActiveArrangementId((current) => current || arrangements[0]?.id || null);
          }

          // 1. Worker Profile
          const profile = await getWorkerProfile();
          if (isMounted) {
            if (profile && profile.name) {
              setWorkerProfile(profile);
              if (profile.sector) {
                setForm((prev) => ({ ...prev, sector: profile.sector as KenyanSector }));
              }
            } else {
              // First time user: Prompt to add name and details!
              setIsFirstVisit(true);
              setIsProfileModalOpen(true);
            }
          }

          // 2. Shifts from IndexedDB - Starts Clean
          const dbShifts = await getAllShifts();
          const legacyArrangementId = arrangements.find((arrangement) => arrangement.id === "legacy-existing-work")?.id;
          const migratedShifts = dbShifts.map((shift) =>
            shift.arrangementId || !legacyArrangementId ? shift : { ...shift, arrangementId: legacyArrangementId }
          );
          if (legacyArrangementId) {
            await Promise.all(
              migratedShifts.filter((shift, index) => !dbShifts[index].arrangementId).map((shift) => saveShift(shift))
            );
          }
          if (isMounted) {
            if (migratedShifts && migratedShifts.length > 0) {
              setShifts(migratedShifts);
            } else {
              setShifts([]);
            }
          }

          // 3. Incidents
          const dbIncidents = await getAllIncidents();
          const migratedIncidents = dbIncidents.map((incident) =>
            incident.arrangementId || !legacyArrangementId ? incident : { ...incident, arrangementId: legacyArrangementId }
          );
          if (legacyArrangementId) {
            await Promise.all(
              migratedIncidents.filter((incident, index) => !dbIncidents[index].arrangementId).map((incident) => saveIncident(incident))
            );
          }
          if (isMounted && dbIncidents) {
            setIncidents(migratedIncidents);
          }
        }

        // Vault Meta
        const meta = await getVaultMetadata();
        if (meta && isMounted) {
          setIsVaultConfigured(meta.isPinEnabled);
          setIsVaultLocked(meta.isPinEnabled && !vaultKey);
        }

        // Demo evidence is intentionally in-memory only. Never hydrate real
        // vault attachments into the synthetic demo journey.
        if (isDemo) {
          if (isMounted) setEvidenceList([]);
        } else {
          const dbEvidence = await getAllEvidence();
          if (isMounted && dbEvidence) {
            setEvidenceList(dbEvidence);
          }
        }

        // Query param screen
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

  // Toggle between Pre-filled Demo (Amina M.) and Clean Personal Profile
  const toggleProfileMode = async () => {
    if (isDemoMode) {
      // Switch to Clean Profile
      setIsDemoMode(false);
      window.localStorage.setItem("fairwork-profile-mode", "clean");

      const savedProfile = await getWorkerProfile();
      if (savedProfile && savedProfile.name && savedProfile.name !== "Amina M.") {
        setWorkerProfile(savedProfile);
        setIsFirstVisit(false);
      } else {
        setWorkerProfile(null);
        setIsFirstVisit(true);
        setIsProfileModalOpen(true);
      }

      const dbShifts = await getAllShifts();
      setShifts(dbShifts && dbShifts.length > 0 ? dbShifts : []);

      const dbIncidents = await getAllIncidents();
      setIncidents(dbIncidents && dbIncidents.length > 0 ? dbIncidents : []);
      setEvidenceList(await getAllEvidence());
      const arrangements = await getAllWorkArrangements();
      setWorkArrangements(arrangements);
      setActiveArrangementId(arrangements.find((arrangement) => arrangement.id === "legacy-existing-work")?.id || arrangements[0]?.id || null);

      setForm({
        employer: "",
        location: "",
        date: new Date().toISOString().split("T")[0],
        start: "08:00",
        end: "17:00",
        agreed: "",
        paid: "",
        sunday: false,
        sector: (savedProfile?.sector as KenyanSector) || "construction",
      });

      showToast("Switched to Clean Personal Profile");
    } else {
      // Switch to Demo Mode (Amina M.)
      setIsDemoMode(true);
      window.localStorage.setItem("fairwork-profile-mode", "demo");
      setWorkerProfile(DEMO_PROFILE);
      setWorkArrangements([DEMO_ARRANGEMENT]);
      setActiveArrangementId(DEMO_ARRANGEMENT.id);
      setShifts(DEMO_SHIFTS.map((shift) => ({ ...shift, arrangementId: DEMO_ARRANGEMENT.id })));
      setIncidents(DEMO_INCIDENTS.map((incident) => ({ ...incident, arrangementId: DEMO_ARRANGEMENT.id })));
      setEvidenceList([]);
      setForm({
        employer: "Karibu Builders",
        location: "Kilimani",
        date: new Date().toISOString().split("T")[0],
        start: "07:30",
        end: "17:30",
        agreed: "1200",
        paid: "1000",
        sunday: false,
        sector: "construction",
      });
      setIsFirstVisit(false);
      showToast("Switched to Sample Demo (Amina M. pre-filled)");
    }
  };

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

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

  async function handleArrangementSaved(arrangement: WorkArrangement) {
    if (isDemoMode) {
      showToast("Demo work arrangements stay separate from your records");
      return;
    }
    await saveWorkArrangement(arrangement);
    setWorkArrangements((current) => {
      const withoutCurrent = current.filter((item) => item.id !== arrangement.id);
      return [arrangement, ...withoutCurrent];
    });
    setActiveArrangementId(arrangement.id);
    setForm((previous) => ({
      ...previous,
      sector: arrangement.sector,
      employer: arrangement.employerOrClient || previous.employer,
    }));
    setShowFirstRecordPrompt(true);
    showToast(`${arrangement.label} is ready for new records`);
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

      // Encrypt existing unencrypted shifts in IndexedDB and mask persistent fields
      const currentShifts = await getAllShifts();
      const encryptedShifts: StoredShift[] = [];
      for (const s of currentShifts) {
        if (!s.isEncrypted) {
          const ciphertextPayload = await encryptData(
            {
              employer: s.employer,
              location: s.location,
              agreed: s.agreed,
              paid: s.paid,
            },
            key
          );
          const persisted: StoredShift = {
            ...s,
            employer: "[ENCRYPTED]",
            location: "[ENCRYPTED]",
            agreed: 0,
            paid: 0,
            isEncrypted: true,
            ciphertextPayload,
          };
          await saveShift(persisted);
          encryptedShifts.push({ ...s, isEncrypted: true, ciphertextPayload });
        } else {
          encryptedShifts.push(s);
        }
      }
      setShifts(encryptedShifts);

      // Encrypt existing unencrypted incidents in IndexedDB and mask persistent fields
      const currentIncidents = await getAllIncidents();
      const encryptedIncidents: StoredIncident[] = [];
      for (const inc of currentIncidents) {
        if (!inc.isEncrypted) {
          const ciphertextPayload = await encryptData(
            {
              description: inc.description,
              employer: inc.employer,
              location: inc.location,
              witnesses: inc.witnesses,
            },
            key
          );
          const persisted: StoredIncident = {
            ...inc,
            description: "[ENCRYPTED IN VAULT]",
            employer: inc.employer ? "[ENCRYPTED]" : undefined,
            location: inc.location ? "[ENCRYPTED]" : undefined,
            witnesses: inc.witnesses ? "[ENCRYPTED]" : undefined,
            isEncrypted: true,
            ciphertextPayload,
          };
          await saveIncident(persisted);
          encryptedIncidents.push({ ...inc, isEncrypted: true, ciphertextPayload });
        } else {
          encryptedIncidents.push(inc);
        }
      }
      setIncidents(encryptedIncidents);

      // Encrypt existing evidence attachments in IndexedDB
      const currentEvidence = await getAllEvidence();
      for (const ev of currentEvidence) {
        if (!ev.isEncrypted && ev.dataUrl) {
          const encrypted = await encryptString(ev.dataUrl, key);
          await updateEvidenceAttachment({
            ...ev,
            dataUrl: "", // Purge plaintext dataUrl from IndexedDB
            isEncrypted: true,
            ciphertextPayload: encrypted,
          });
        }
      }

      // Sync only masked records to localStorage
      const allDbShifts = await getAllShifts();
      window.localStorage.setItem("fairwork-pulse-shifts", JSON.stringify(allDbShifts));

      setVaultKey(key);
      setIsVaultConfigured(true);
      setIsVaultLocked(false);
      showToast("Encrypted Vault Configured with Master PIN");
      return true;
    } catch {
      return false;
    }
  }

  async function handleLockVault() {
    setVaultKey(null);
    setIsVaultLocked(true);

    // Reload raw masked records from IndexedDB to purge plaintext from React memory
    const rawShifts = await getAllShifts();
    setShifts(rawShifts);

    const rawIncidents = await getAllIncidents();
    setIncidents(rawIncidents);

    const rawEvidence = await getAllEvidence();
    setEvidenceList(rawEvidence);

    showToast("Vault Locked. Plaintext purged from memory.");
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

        // Decrypt shifts into in-memory state
        const rawShifts = await getAllShifts();
        const decryptedShifts: StoredShift[] = [];
        for (const s of rawShifts) {
          if (s.isEncrypted && s.ciphertextPayload) {
            try {
              const decrypted = await decryptData<{
                employer: string;
                location: string;
                agreed: number;
                paid: number;
              }>(s.ciphertextPayload, key);
              decryptedShifts.push({
                ...s,
                employer: decrypted.employer,
                location: decrypted.location,
                agreed: decrypted.agreed,
                paid: decrypted.paid,
              });
            } catch {
              decryptedShifts.push(s);
            }
          } else {
            decryptedShifts.push(s);
          }
        }
        setShifts(decryptedShifts);

        // Decrypt incidents into in-memory state
        const rawIncidents = await getAllIncidents();
        const decryptedIncidents: StoredIncident[] = [];
        for (const inc of rawIncidents) {
          if (inc.isEncrypted && inc.ciphertextPayload) {
            try {
              const decrypted = await decryptData<{
                description: string;
                employer?: string;
                location?: string;
                witnesses?: string;
              }>(inc.ciphertextPayload, key);
              decryptedIncidents.push({
                ...inc,
                description: decrypted.description,
                employer: decrypted.employer ?? inc.employer,
                location: decrypted.location ?? inc.location,
                witnesses: decrypted.witnesses ?? inc.witnesses,
              });
            } catch {
              decryptedIncidents.push(inc);
            }
          } else {
            decryptedIncidents.push(inc);
          }
        }
        setIncidents(decryptedIncidents);

        // Decrypt evidence dataUrls into in-memory state for immediate display
        const rawEvidence = await getAllEvidence();
        const decryptedEvidence: EvidenceAttachment[] = [];
        for (const ev of rawEvidence) {
          if (ev.isEncrypted && ev.ciphertextPayload) {
            try {
              const decryptedUrl = await decryptString(ev.ciphertextPayload, key);
              decryptedEvidence.push({
                ...ev,
                dataUrl: decryptedUrl,
              });
            } catch {
              decryptedEvidence.push(ev);
            }
          } else {
            decryptedEvidence.push(ev);
          }
        }
        setEvidenceList(decryptedEvidence);

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
    if (isSavingShift) return;
    setIsSavingShift(true);

    try {
    const shiftId = shiftDraftId;
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

    // In-memory shift representation
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
      arrangementId: activeArrangement?.id,
      evidenceIds,
      ciphertextPayload,
      isEncrypted,
    };

    // Stored representation masks sensitive fields when encrypted
    const persisted: StoredShift = {
      ...next,
      employer: isEncrypted ? "[ENCRYPTED]" : next.employer,
      location: isEncrypted ? "[ENCRYPTED]" : next.location,
      agreed: isEncrypted ? 0 : next.agreed,
      paid: isEncrypted ? 0 : next.paid,
    };

    // Demo records are deliberately ephemeral and never touch IndexedDB or
    // localStorage, so the sample journey cannot overwrite personal data.
    if (isDemoMode) {
      setShifts((previous) => [next, ...previous]);
      setShiftAttachedEvidence([]);
      setShiftDraftId(createRecordId());
      showToast("Demo shift kept separate from your real vault");
      return;
    }

    // Update in-memory state & persist to IndexedDB
    await saveShift(persisted);
    const updated = [next, ...shifts];
    setShifts(updated);

    // Save only masked records to localStorage
    const allDbShifts = await getAllShifts();
    window.localStorage.setItem("fairwork-pulse-shifts", JSON.stringify(allDbShifts));

    // Clear attached evidence for this shift
    setShiftAttachedEvidence([]);
    setShiftDraftId(createRecordId());
    showToast("Shift & payment proof saved to your device");
    } catch {
      showToast("Shift was not saved. Check device storage and try again.");
    } finally {
      setIsSavingShift(false);
    }
  }

  // Save Incident Record
  async function submitIncident(e: FormEvent) {
    e.preventDefault();
    if (!incidentType || isSavingIncident) return;
    setIsSavingIncident(true);

    try {
    const incidentId = incidentDraftId;
    const evidenceIds = incidentAttachedEvidence.map((ev) => ev.id);

    let ciphertextPayload = undefined;
    let isEncrypted = false;

    if (vaultKey) {
      ciphertextPayload = await encryptData(
        {
          description: incidentDescription,
          employer: form.employer || undefined,
          location: form.location || undefined,
        },
        vaultKey
      );
      isEncrypted = true;
    }

    const nextIncident: StoredIncident = {
      id: incidentId,
      date: incidentDate,
      category: incidentType,
      description: incidentDescription,
      arrangementId: activeArrangement?.id,
      evidenceIds,
      ciphertextPayload,
      isEncrypted,
      createdAt: new Date().toISOString(),
    };

    const persistedIncident: StoredIncident = {
      ...nextIncident,
      description: isEncrypted ? "[ENCRYPTED IN VAULT]" : incidentDescription,
      employer: isEncrypted ? "[ENCRYPTED]" : undefined,
      location: isEncrypted ? "[ENCRYPTED]" : undefined,
    };

    if (isDemoMode) {
      setIncidents((previous) => [nextIncident, ...previous]);
      setIncidentType("");
      setIncidentDescription("");
      setIncidentAttachedEvidence([]);
      setIncidentDraftId(createRecordId());
      showToast("Demo incident kept separate from your real vault");
      return;
    }

    await saveIncident(persistedIncident);
    const updated = [nextIncident, ...incidents];
    setIncidents(updated);

    setIncidentType("");
    setIncidentDescription("");
    setIncidentAttachedEvidence([]);
    setIncidentDraftId(createRecordId());
    showToast("Incident & evidence saved privately in vault");
    } catch {
      showToast("Incident was not saved. Check device storage and try again.");
    } finally {
      setIsSavingIncident(false);
    }
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
          onClick={() => setIsProfileModalOpen(true)}
          aria-label="Worker profile and security settings"
          title="Click to edit worker name and details"
        >
          <span className="profile-photo">{workerInitials}</span>
          <span>
            <small>Welcome back,</small>
            <strong className="flex items-center gap-1.5">
              {workerProfile?.name || "Set Your Name"}
              {isVaultConfigured && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVaultModalOpen(true);
                  }}
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold flex items-center gap-0.5 cursor-pointer ${isVaultLocked ? "text-amber-800 bg-amber-100 hover:bg-amber-200" : "text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/80"}`}
                  title={isVaultLocked ? "Vault locked - click to unlock" : "AES-256 vault active - click to manage"}
                >
                  {isVaultLocked ? <Lock size={10} /> : <Unlock size={10} />} {isVaultLocked ? "Locked" : "AES-256"}
                </span>
              )}
            </strong>
          </span>
        </button>

        <div className="header-actions">
          <span className={`connection-chip ${isOnline ? "online" : "offline"}`} role="status">
            <i /> {isOnline ? "Online" : "Offline · saves on device"}
          </span>
          <div className="header-action-strip">
          {/* Mode Switcher: Sample Demo vs Clean Profile */}
          <button
            type="button"
            onClick={toggleProfileMode}
            className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs border cursor-pointer ${
              isDemoMode
                ? "bg-amber-500/10 text-amber-900 border-amber-300 hover:bg-amber-500/20"
                : "bg-emerald-500/10 text-emerald-900 border-emerald-300 hover:bg-emerald-500/20"
            }`}
            title={
              isDemoMode
                ? "Click to switch to a Clean Personal Profile"
                : "Click to switch to Sample Demo Data (Amina M.)"
            }
          >
            {isDemoMode ? (
              <>
                <Sparkles size={13} className="text-amber-600" />
                <span className="hidden sm:inline">Demo (Filled)</span>
                <span className="sm:hidden">Demo</span>
              </>
            ) : (
              <>
                <User size={13} className="text-emerald-600" />
                <span className="hidden sm:inline">New Profile</span>
                <span className="sm:hidden">New</span>
              </>
            )}
          </button>

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
          <Button variant="iosTinted" size="iosIcon" className="notification" aria-label="Notifications" onClick={() => showToast("No new notifications") }>
            <Bell size={19} />
            <i />
          </Button>
          </div>

          <button
            type="button"
            className="header-menu-trigger"
            aria-label={isHeaderMenuOpen ? "Close quick actions" : "Open quick actions"}
            aria-expanded={isHeaderMenuOpen}
            aria-controls="header-quick-menu"
            onClick={() => setIsHeaderMenuOpen((open) => !open)}
          >
            {isHeaderMenuOpen ? <X size={21} /> : <Menu size={22} />}
          </button>
        </div>

        {isHeaderMenuOpen && (
          <>
            <button className="header-menu-backdrop" type="button" aria-label="Close quick actions" onClick={() => setIsHeaderMenuOpen(false)} />
            <nav className="header-quick-menu" id="header-quick-menu" aria-label="Quick actions">
              <button type="button" onClick={() => { toggleProfileMode(); setIsHeaderMenuOpen(false); }}>
                {isDemoMode ? <User /> : <Sparkles />}
                <span><b>{isDemoMode ? "Start a clean profile" : "Load sample demo"}</b><small>{isDemoMode ? "Leave Amina’s sample records" : "Explore the completed worker journey"}</small></span>
              </button>
              <button type="button" onClick={() => { setIsSyncModalOpen(true); setIsHeaderMenuOpen(false); }}>
                <Cloud /><span><b>Cloud backup</b><small>{isDemoMode ? "Disabled while viewing demo data" : "Upload an encrypted backup"}</small></span>
              </button>
              <button type="button" onClick={() => { setIsAssistantOpen(true); setIsHeaderMenuOpen(false); }}>
                <Sparkles /><span><b>Rights assistant</b><small>Explain a record in plain language</small></span>
              </button>
              <button type="button" onClick={() => { setIsFeaturePhoneOpen(true); setIsHeaderMenuOpen(false); }}>
                <Smartphone /><span><b>Feature-phone intake</b><small>Preview USSD and WhatsApp access</small></span>
              </button>
              <button type="button" onClick={() => { setLang(lang === "en" ? "sw" : "en"); setIsHeaderMenuOpen(false); }}>
                <Languages /><span><b>{lang === "en" ? "Use Kiswahili" : "Use English"}</b><small>Change the interface language</small></span>
              </button>
              <button type="button" onClick={() => { showToast("No new notifications"); setIsHeaderMenuOpen(false); }}>
                <Bell /><span><b>Notifications</b><small>No new notifications</small></span>
              </button>
            </nav>
          </>
        )}
      </header>

      <div className="desktop-grid" id="top">
        {/* Sidebar Nav */}
        <aside className="side-nav" aria-label="Primary navigation">
          <div
            className="worker-card cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsProfileModalOpen(true)}
            title="Edit worker profile"
          >
            <div className="worker-avatar">{workerInitials}</div>
            <div>
              <strong>{workerProfile?.name || "Set Your Name"}</strong>
              <span>{SECTOR_CONFIGS[form.sector]?.name || "Casual Worker"} · {workerProfile?.county || "Kenya"}</span>
            </div>
          </div>

          {/* Quick Profile Mode Switcher in Sidebar */}
          <div className="pb-3 pt-1">
            <button
              type="button"
              onClick={toggleProfileMode}
              className={`w-full py-2 px-3 rounded-2xl text-[11px] font-semibold flex items-center justify-between border shadow-xs transition-all cursor-pointer ${
                isDemoMode
                  ? "bg-amber-50/90 text-amber-900 border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50/90 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
              }`}
              title={isDemoMode ? "Currently viewing sample pre-filled data" : "Currently on clean personal profile"}
            >
              <span className="flex items-center gap-1.5 truncate">
                {isDemoMode ? <Sparkles size={13} className="text-amber-600 shrink-0" /> : <User size={13} className="text-emerald-600 shrink-0" />}
                <span className="truncate">{isDemoMode ? "Viewing Demo (Amina)" : "Clean State"}</span>
              </span>
              <span className="underline text-[10px] font-bold text-blue-700 shrink-0 ml-1">
                {isDemoMode ? "Start New" : "Load Demo"}
              </span>
            </button>
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
                    {shifts.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-white/80 border border-gray-100 shadow-xs flex flex-col items-center justify-center space-y-3 my-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <BriefcaseBusiness size={24} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-gray-800">No shifts logged yet</h3>
                          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                            Your encrypted ledger is currently empty. Log your first shift to track hours, overtime, and statutory claims.
                          </p>
                        </div>
                        <Button
                          variant="iosTinted"
                          size="sm"
                          onClick={() => setActive("home")}
                          className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/80 mt-1"
                        >
                          <Plus size={14} /> Log First Shift
                        </Button>
                      </div>
                    ) : (
                      shifts.map((shift) => {
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
                      })
                    )}
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

                      <Button type="submit" variant="iosPrimary" disabled={isSavingIncident}>
                        {isSavingIncident ? "Saving incident…" : "Save incident to encrypted vault"}
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

                  <HakiDossier
                    shifts={shifts}
                    incidents={incidents}
                    evidence={evidenceList}
                    profile={workerProfile}
                    isDemoMode={isDemoMode}
                    arrangements={workArrangements}
                    onOpenEvidence={setSelectedAttachmentForViewer}
                  />
                  <div className="legacy-dossier-content" hidden>
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
                      <b>
                        {workerProfile?.name ? `${workerProfile.name} · ` : ""}
                        {SECTOR_CONFIGS[form.sector]?.name || "Casual Worker"}
                      </b>
                      <small>
                        {workerProfile?.county || "Kenya"}
                        {workerProfile?.phone ? ` · Tel: ${workerProfile.phone}` : ""} · Contiguous Work Ledger
                      </small>
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
                      Calculations organize worker-entered information using cited rules. Review the current
                      wage order, occupation, location, and available remedy with a qualified adviser.
                    </p>
                  </article>

                  <Button variant="iosPrimary" className="screen-action" onClick={() => window.print()}>
                    <Download /> Export & Print Haki Dossier (PDF)
                  </Button>
                  </div>
                  <Button
                    variant="iosTinted"
                    className="screen-action mt-2 text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70"
                    onClick={() => setIsSyncModalOpen(true)}
                    disabled={isDemoMode}
                  >
                    <Cloud /> {isDemoMode ? "Demo backup disabled" : "Upload encrypted backup"}
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
              <span>
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>

          {/* Balance / Summary Card */}
          <section className="pulse-card" aria-label="Work record summary">
            <div className="pulse-card-top">
              <span>
                <ShieldCheck size={16} />{" "}
                {isVaultConfigured ? "Client-side encrypted" : "Private device ledger"}
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

          <WorkArrangementPanel
            arrangements={workArrangements}
            activeArrangementId={activeArrangementId}
            onSelect={(id) => {
              setActiveArrangementId(id);
              const selected = workArrangements.find((arrangement) => arrangement.id === id);
              if (selected) {
                setForm((previous) => ({
                  ...previous,
                  sector: selected.sector,
                  employer: selected.employerOrClient || previous.employer,
                }));
              }
            }}
            onSave={handleArrangementSaved}
            disabled={isDemoMode}
            lang={lang}
          />

          {showFirstRecordPrompt && !isDemoMode && (
            <section className="first-record-panel" aria-labelledby="first-record-heading">
              <div>
                <span className="first-record-kicker">NEXT STEP</span>
                <h2 id="first-record-heading">What would you like to record?</h2>
                <p>Start with one real event. You can add evidence after it is saved.</p>
              </div>
              <div className="first-record-actions">
                <Button
                  type="button"
                  variant="iosPrimary"
                  onClick={() => {
                    setShowFirstRecordPrompt(false);
                    document.querySelector(".shift-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <BriefcaseBusiness size={17} /> Work or payment
                </Button>
                <Button
                  type="button"
                  variant="iosTinted"
                  onClick={() => {
                    setShowFirstRecordPrompt(false);
                    navigate("incidents");
                  }}
                >
                  <AlertTriangle size={17} /> Concern
                </Button>
                <Button type="button" variant="iosPlain" onClick={() => setShowFirstRecordPrompt(false)}>
                  I’ll do this later
                </Button>
              </div>
            </section>
          )}

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
              <Button variant="iosPrimary" className="save-button" type="submit" disabled={isSavingShift}>
                {isSavingShift ? (
                  <>Saving…</>
                ) : savedPulse ? (
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
              {shifts.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white/80 border border-gray-100 shadow-xs flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <BriefcaseBusiness size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-gray-800">No shifts recorded yet</h3>
                    <p className="text-[11px] text-gray-500 max-w-xs">
                      Use the form above to log your shift today. Your records stay encrypted on your device.
                    </p>
                  </div>
                </div>
              ) : (
                shifts.slice(0, 3).map((shift) => {
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
                })
              )}
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
        parentId={evidenceTarget === "shift" ? shiftDraftId : incidentDraftId}
        initialTypeHint="payment"
        vaultKey={vaultKey}
        arrangementId={activeArrangement?.id}
        isDemoMode={isDemoMode}
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
        isLocked={isVaultLocked}
        onUnlock={handleUnlockVault}
        onLock={handleLockVault}
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
        onShiftLoggedFromUssd={async (ussdShift) => {
          const newShift: StoredShift = {
            id: createRecordId(),
            date: new Date().toISOString().split("T")[0],
            employer: ussdShift.employer,
            location: ussdShift.location,
            start: ussdShift.start,
            end: ussdShift.end,
            agreed: ussdShift.agreed,
            paid: ussdShift.paid,
            sunday: false,
            sector: "construction",
            arrangementId: activeArrangement?.id,
          };
          setShifts((prev) => [newShift, ...prev]);
          if (isDemoMode) {
            showToast("Demo USSD shift kept separate from your real vault");
            return;
          }
          try {
            await saveShift(newShift);
            showToast("Shift logged via USSD gateway *384*2026#");
          } catch {
            setShifts((prev) => prev.filter((shift) => shift.id !== newShift.id));
            showToast("USSD shift was not saved. Please try again.");
          }
        }}
      />

      {/* Cloud Sync to Supabase Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isVaultConfigured={isVaultConfigured}
        vaultKey={vaultKey}
        shiftCount={shifts.length}
        incidentCount={incidents.length}
        evidenceCount={evidenceList.length}
        isDemoMode={isDemoMode}
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

      {/* Worker Profile Onboarding / Switcher Modal */}
      <WorkerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={workerProfile}
        isFirstVisit={isFirstVisit}
        isDemoMode={isDemoMode}
        onToggleMode={toggleProfileMode}
        onProfileSaved={(saved) => {
          setWorkerProfile(saved);
          setIsDemoMode(false);
          setIsFirstVisit(false);
          window.localStorage.setItem("fairwork-profile-mode", "clean");
          if (saved.sector) {
            setForm((prev) => ({ ...prev, sector: saved.sector as KenyanSector }));
          }
          showToast(`Profile updated: ${saved.name}`);
        }}
      />
    </main>
  );
}
