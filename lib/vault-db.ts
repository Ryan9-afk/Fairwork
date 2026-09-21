/**
 * IndexedDB storage engine for Fairwork Pulse.
 * Manages zero-knowledge encrypted vaults, persistent shifts, incidents,
 * and high-integrity evidence attachments (M-Pesa screenshots, receipts, photos)
 * with SHA-256 chain-of-custody tracking.
 */

import { computeSha256, encryptString, decryptString } from "./crypto";

export interface EvidenceAttachment {
  id: string;
  parentId?: number | string; // Shift ID or Incident ID
  parentType: "shift" | "incident";
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string; // Base64 data URL for instant rendering (empty if stored encrypted in vault)
  sha256Hash: string;
  createdAt: string;
  paymentType?: "mpesa" | "cash_receipt" | "bank" | "general";
  notes?: string;
  isEncrypted?: boolean;
  ciphertextPayload?: { ciphertext: string; iv: string };
}

export interface StoredShift {
  id: number;
  date: string; // Plaintext searchable index
  employer: string;
  location: string;
  start: string;
  end: string;
  agreed: number;
  paid: number;
  sunday: boolean;
  sector?: string;
  evidenceIds?: string[];
  ciphertextPayload?: { ciphertext: string; iv: string };
  isEncrypted?: boolean;
}

export interface StoredIncident {
  id: number;
  date: string; // Plaintext searchable index
  category: "injury" | "wages" | "maternity" | "termination" | "safety";
  description: string;
  employer?: string;
  location?: string;
  witnesses?: string;
  remedySought?: string;
  evidenceIds?: string[];
  ciphertextPayload?: { ciphertext: string; iv: string };
  isEncrypted?: boolean;
  createdAt: string;
}

export interface VaultMetadata {
  id: "primary";
  saltBase64: string;
  verifyTokenPayload: { ciphertext: string; iv: string };
  isPinEnabled: boolean;
  createdAt: string;
}

export interface WorkerProfile {
  id: "current";
  name: string;
  phone?: string;
  county?: string;
  sector?: string;
  updatedAt: string;
}

const DB_NAME = "fairwork_pulse_vault_v1";
const DB_VERSION = 2;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("vault_meta")) {
        db.createObjectStore("vault_meta", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("shifts")) {
        const shiftStore = db.createObjectStore("shifts", { keyPath: "id" });
        shiftStore.createIndex("date", "date", { unique: false });
      }

      if (!db.objectStoreNames.contains("incidents")) {
        const incidentStore = db.createObjectStore("incidents", { keyPath: "id" });
        incidentStore.createIndex("date", "date", { unique: false });
        incidentStore.createIndex("category", "category", { unique: false });
      }

      if (!db.objectStoreNames.contains("evidence")) {
        const evidenceStore = db.createObjectStore("evidence", { keyPath: "id" });
        evidenceStore.createIndex("parentId", "parentId", { unique: false });
        evidenceStore.createIndex("parentType", "parentType", { unique: false });
        evidenceStore.createIndex("sha256Hash", "sha256Hash", { unique: false });
      }

      if (!db.objectStoreNames.contains("worker_profile")) {
        db.createObjectStore("worker_profile", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------- Worker Profile ----------------

export async function getWorkerProfile(): Promise<WorkerProfile | null> {
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains("worker_profile")) {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("fairwork-worker-profile") : null;
      return stored ? JSON.parse(stored) : null;
    }
    return new Promise((resolve) => {
      const tx = db.transaction("worker_profile", "readonly");
      const store = tx.objectStore("worker_profile");
      const req = store.get("current");
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else {
          const stored = typeof window !== "undefined" ? window.localStorage.getItem("fairwork-worker-profile") : null;
          resolve(stored ? JSON.parse(stored) : null);
        }
      };
      req.onerror = () => {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem("fairwork-worker-profile") : null;
        resolve(stored ? JSON.parse(stored) : null);
      };
    });
  } catch {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("fairwork-worker-profile") : null;
    return stored ? JSON.parse(stored) : null;
  }
}

export async function saveWorkerProfile(profile: WorkerProfile): Promise<void> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("fairwork-worker-profile", JSON.stringify(profile));
  }
  try {
    const db = await openDatabase();
    if (db.objectStoreNames.contains("worker_profile")) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction("worker_profile", "readwrite");
        const store = tx.objectStore("worker_profile");
        const req = store.put(profile);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  } catch {}
}

// ---------------- Vault Metadata ----------------

export async function getVaultMetadata(): Promise<VaultMetadata | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("vault_meta", "readonly");
    const store = tx.objectStore("vault_meta");
    const req = store.get("primary");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVaultMetadata(meta: VaultMetadata): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("vault_meta", "readwrite");
    const store = tx.objectStore("vault_meta");
    const req = store.put(meta);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Shifts ----------------

export async function getAllShifts(): Promise<StoredShift[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("shifts", "readonly");
    const store = tx.objectStore("shifts");
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result as StoredShift[]) || [];
      results.sort((a, b) => b.id - a.id);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveShift(shift: StoredShift): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("shifts", "readwrite");
    const store = tx.objectStore("shifts");
    const req = store.put(shift);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteShift(id: number): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("shifts", "readwrite");
    const store = tx.objectStore("shifts");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Incidents ----------------

export async function getAllIncidents(): Promise<StoredIncident[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("incidents", "readonly");
    const store = tx.objectStore("incidents");
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result as StoredIncident[]) || [];
      results.sort((a, b) => b.id - a.id);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveIncident(incident: StoredIncident): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("incidents", "readwrite");
    const store = tx.objectStore("incidents");
    const req = store.put(incident);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Evidence & Payment Screenshots ----------------

export async function saveEvidenceAttachment(
  file: File,
  parentType: "shift" | "incident",
  parentId?: number | string,
  notes?: string,
  vaultKey?: CryptoKey | null
): Promise<EvidenceAttachment> {
  const arrayBuffer = await file.arrayBuffer();
  const sha256Hash = await computeSha256(arrayBuffer);

  // Convert to Base64 dataUrl for storage and immediate display
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const lowerName = file.name.toLowerCase();
  let paymentType: EvidenceAttachment["paymentType"] = "general";
  if (lowerName.includes("mpesa") || lowerName.includes("m-pesa") || lowerName.includes("safaricom")) {
    paymentType = "mpesa";
  } else if (lowerName.includes("receipt") || lowerName.includes("slip")) {
    paymentType = "cash_receipt";
  } else if (lowerName.includes("bank") || lowerName.includes("equity") || lowerName.includes("kcb")) {
    paymentType = "bank";
  }

  let ciphertextPayload: { ciphertext: string; iv: string } | undefined = undefined;
  let isEncrypted = false;
  let storedDataUrl = dataUrl;

  if (vaultKey) {
    ciphertextPayload = await encryptString(dataUrl, vaultKey);
    isEncrypted = true;
    storedDataUrl = ""; // Purge plaintext dataUrl from persistent IndexedDB
  }

  const attachment: EvidenceAttachment = {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    parentId,
    parentType,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "image/jpeg",
    dataUrl: storedDataUrl,
    sha256Hash,
    createdAt: new Date().toISOString(),
    paymentType,
    notes,
    isEncrypted,
    ciphertextPayload,
  };

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("evidence", "readwrite");
    const store = tx.objectStore("evidence");
    const req = store.put(attachment);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Return in-memory instance with active dataUrl for immediate React rendering
  return { ...attachment, dataUrl };
}

export async function decryptEvidenceAttachment(
  attachment: EvidenceAttachment,
  key: CryptoKey
): Promise<string> {
  if (!attachment.isEncrypted || !attachment.ciphertextPayload) {
    return attachment.dataUrl;
  }
  return decryptString(attachment.ciphertextPayload, key);
}

export async function updateEvidenceAttachment(attachment: EvidenceAttachment): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("evidence", "readwrite");
    const store = tx.objectStore("evidence");
    const req = store.put(attachment);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getEvidenceForParent(
  parentType: "shift" | "incident",
  parentId: number | string
): Promise<EvidenceAttachment[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("evidence", "readonly");
    const store = tx.objectStore("evidence");
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as EvidenceAttachment[]) || [];
      resolve(all.filter((item) => item.parentType === parentType && String(item.parentId) === String(parentId)));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEvidence(): Promise<EvidenceAttachment[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("evidence", "readonly");
    const store = tx.objectStore("evidence");
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as EvidenceAttachment[]) || [];
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}
