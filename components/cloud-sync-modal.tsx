"use client";

import { useState } from "react";
import {
  Cloud,
  CloudUpload,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncVaultToSupabase } from "@/utils/supabase/sync";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVaultConfigured: boolean;
  vaultKey?: CryptoKey | null;
  shiftCount: number;
  incidentCount: number;
  evidenceCount: number;
  isDemoMode?: boolean;
  onSyncComplete?: (result: { shifts: number; incidents: number; evidence: number }) => void;
}

export function CloudSyncModal({
  isOpen,
  onClose,
  isVaultConfigured,
  vaultKey,
  shiftCount,
  incidentCount,
  evidenceCount,
  isDemoMode = false,
  onSyncComplete,
}: CloudSyncModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleTriggerSync() {
    if (isDemoMode) {
      setSyncStatus("error");
      setStatusMessage("Demo records stay on this device and cannot be uploaded.");
      return;
    }
    setIsSyncing(true);
    setSyncStatus("idle");
    setStatusMessage("Synchronizing encrypted records with Supabase...");

    try {
      const result = await syncVaultToSupabase(vaultKey);

      if (result.success) {
        setSyncStatus("success");
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSyncTime(timeStr);
        setStatusMessage(
          `Successfully backed up ${result.uploadedShifts} shifts, ${result.uploadedIncidents} incidents, and ${result.uploadedEvidence} evidence hashes.`
        );
        if (onSyncComplete) {
          onSyncComplete({
            shifts: result.uploadedShifts,
            incidents: result.uploadedIncidents,
            evidence: result.uploadedEvidence,
          });
        }
      } else {
        setSyncStatus("error");
        setStatusMessage(result.error || "Failed to sync with Supabase.");
      }
    } catch (err) {
      setSyncStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Unexpected synchronization error.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-sync-title"
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <CloudUpload size={24} />
          </div>
          <div>
            <h2 id="cloud-sync-title" className="text-lg font-bold text-gray-900 leading-tight">
              Encrypted Cloud Backup
            </h2>
            <p className="text-xs text-gray-500">
              Supabase PostgreSQL · Optional encrypted backup
            </p>
          </div>
        </div>

        {/* Encryption status */}
        <div
          className={`p-3.5 rounded-2xl mb-4 border flex items-start gap-3 ${
            isVaultConfigured
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : "bg-amber-50/70 border-amber-200 text-amber-900"
          }`}
        >
          {isVaultConfigured ? (
            <Lock size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <Unlock size={18} className="text-amber-700 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <strong className="font-semibold block mb-0.5">
              {isVaultConfigured ? "Client-side encryption active" : "Standard backup mode"}
            </strong>
            <p className="leading-relaxed text-gray-600">
              {isVaultConfigured
                ? "Sensitive wages, employer names, and dispute notes are encrypted on-device with AES-GCM-256 before upload. Supabase stores only ciphertext."
                : "Records will use Supabase Row Level Security. Set a Vault PIN before backup to encrypt sensitive record content on this device."}
            </p>
          </div>
        </div>

        {/* Sync Summary Card */}
        <div className="bg-gray-50/80 rounded-2xl p-4 mb-5 border border-gray-200/70">
          <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase block mb-3">
            Items Ready for Backup
          </span>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-xl p-2.5 shadow-xs border border-gray-100">
              <strong className="text-base font-bold text-gray-900 block">{shiftCount}</strong>
              <span className="text-[11px] text-gray-500">Shifts</span>
            </div>
            <div className="bg-white rounded-xl p-2.5 shadow-xs border border-gray-100">
              <strong className="text-base font-bold text-gray-900 block">{incidentCount}</strong>
              <span className="text-[11px] text-gray-500">Incidents</span>
            </div>
            <div className="bg-white rounded-xl p-2.5 shadow-xs border border-gray-100">
              <strong className="text-base font-bold text-gray-900 block">{evidenceCount}</strong>
              <span className="text-[11px] text-gray-500">Evidence</span>
            </div>
          </div>

          {lastSyncTime && (
            <div className="mt-3 text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-200/60">
              <span>Last synced:</span>
              <strong className="text-gray-700 font-medium">{lastSyncTime}</strong>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {syncStatus === "success" && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {syncStatus === "error" && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="iosPlain"
            onClick={onClose}
            className="flex-1 rounded-2xl h-11 text-gray-600"
            disabled={isSyncing || isDemoMode}
          >
            Close
          </Button>

          <Button
            variant="iosPrimary"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex-2 rounded-2xl h-11 flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Cloud size={16} />
                <span>{isDemoMode ? "Demo upload disabled" : "Upload backup"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
