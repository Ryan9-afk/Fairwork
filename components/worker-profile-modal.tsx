"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Briefcase, Check, X, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkerProfile, saveWorkerProfile } from "@/lib/vault-db";
import { KenyanSector } from "@/lib/legal-engine";

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: WorkerProfile | null;
  onProfileSaved: (profile: WorkerProfile) => void;
  isFirstVisit?: boolean;
  isDemoMode?: boolean;
  onToggleMode?: () => void;
}

export function WorkerProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileSaved,
  isFirstVisit = false,
  isDemoMode = false,
  onToggleMode,
}: WorkerProfileModalProps) {
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [county, setCounty] = useState(profile?.county || "Nairobi");
  const [sector, setSector] = useState<KenyanSector>((profile?.sector as KenyanSector) || "construction");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- the form mirrors the selected persisted profile */
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setCounty(profile.county || "Nairobi");
      setSector((profile.sector as KenyanSector) || "construction");
    } else {
      setName("");
      setPhone("");
      setCounty("Nairobi");
      setSector("construction");
    }
  }, [profile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name or nickname to personalize your ledger");
      return;
    }

    setIsSaving(true);
    try {
      const updated: WorkerProfile = {
        id: "current",
        name: trimmedName,
        phone: phone.trim() || undefined,
        county: county.trim() || "Nairobi",
        sector,
        updatedAt: new Date().toISOString(),
      };

      await saveWorkerProfile(updated);
      onProfileSaved(updated);
      onClose();
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worker-profile-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h3 id="worker-profile-title" className="text-base font-bold text-gray-900 leading-tight">
                {isFirstVisit ? "Karibu! Set Up Worker Profile" : "Worker Profile & Ledger"}
              </h3>
              <p className="text-[11px] text-gray-500">
                Stored strictly on your device for your Haki Dossier
              </p>
            </div>
          </div>

          {!isFirstVisit && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick Demo vs Clean Switcher Banner */}
        {onToggleMode && (
          <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between gap-2.5">
            <div className="text-left">
              <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                {isDemoMode ? (
                  <>
                    <Sparkles size={13} className="text-amber-600" />
                    <span>Sample Demo Data Active</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>Personal Clean Profile Active</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-gray-500 block">
                {isDemoMode
                  ? "Amina M. prefilled with sample shifts"
                  : "Clean ledger ready for your own records"}
              </span>
            </div>
            <Button
              type="button"
              variant="iosTinted"
              size="sm"
              onClick={() => {
                onToggleMode();
                if (isDemoMode) {
                  setName("");
                  setPhone("");
                  setCounty("Nairobi");
                } else {
                  setName("Amina M.");
                  setPhone("0712 345 678");
                  setCounty("Nairobi");
                  setSector("construction");
                }
              }}
              className={`text-xs h-8 px-2.5 font-bold shrink-0 ${
                isDemoMode
                  ? "text-emerald-800 bg-emerald-100 hover:bg-emerald-200"
                  : "text-amber-900 bg-amber-100 hover:bg-amber-200"
              }`}
            >
              {isDemoMode ? "Start New Profile" : "Load Sample (Amina)"}
            </Button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-blue-600" />
              Your Name / Preferred Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amina Mwangi or John K."
              className="w-full h-11 px-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
            <p className="text-[10px] text-gray-400">
              Appears as the Complainant on your dispute brief and audit register.
            </p>
          </div>

          {/* Primary Sector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={13} className="text-blue-600" />
              Primary Work Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as KenyanSector)}
              className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            >
              <option value="construction">Construction & Artisans (Ujenzi)</option>
              <option value="agriculture">Agriculture & Tea Picking (Kilimo)</option>
              <option value="domestic">Domestic Workers (Wafanyakazi wa Nyumbani)</option>
              <option value="gig_delivery">Gig Delivery & Boda Boda</option>
            </select>
          </div>

          {/* Location / County */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-600" />
              Work County / Town
            </label>
            <input
              type="text"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="e.g. Nairobi, Mombasa, Kiambu, Nakuru"
              className="w-full h-11 px-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Phone / M-Pesa Number (Optional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={13} className="text-blue-600" />
              Phone / M-Pesa Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712 345 678"
              className="w-full h-11 px-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
            <p className="text-[10px] text-gray-400">
              Used to reconcile payment proofs and SMS audit trails.
            </p>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/80 flex items-start gap-2">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-900 leading-snug">
              <strong>Device-first profile:</strong> Details stay on this device until you choose cloud backup. Profile fields are included in that backup; sensitive record content can be encrypted with your PIN.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              variant="iosPrimary"
              disabled={isSaving || !name.trim()}
              className="w-full h-12 text-sm font-semibold"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Check size={18} /> {isFirstVisit ? "Start Using Fairwork Pulse" : "Save Profile"}
                </>
              )}
            </Button>

            {!isFirstVisit && (
              <Button
                type="button"
                variant="iosPlain"
                onClick={onClose}
                className="w-full text-xs text-gray-500"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
