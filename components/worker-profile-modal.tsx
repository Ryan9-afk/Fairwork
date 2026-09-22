"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Briefcase, Check, X, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkerProfile, saveWorkerProfile } from "@/lib/vault-db";
import { KenyanSector, SECTOR_CONFIGS, SECTOR_IDS } from "@/lib/legal-engine";

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
      className="profile-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worker-profile-title"
    >
      <div className="profile-sheet">
        <header className="profile-sheet-header">
          <div className="profile-sheet-mark"><User size={22} /></div>
          <div>
            <h2 id="worker-profile-title">{isFirstVisit ? "Set up your work record" : "Your worker profile"}</h2>
            <p>{isFirstVisit ? "One minute now makes every record easier to identify." : "Used to label records and prepare your dossier."}</p>
          </div>
          <button type="button" onClick={onClose} className="profile-close" aria-label="Close profile setup"><X size={20} /></button>
        </header>

        <div className="profile-sheet-scroll">
          {onToggleMode && (
            <div className={`profile-mode-row ${isDemoMode ? "demo" : "personal"}`}>
              <span className="profile-mode-icon">{isDemoMode ? <Sparkles size={17} /> : <ShieldCheck size={17} />}</span>
              <span><b>{isDemoMode ? "Sample journey" : "Personal records"}</b><small>{isDemoMode ? "Amina’s fictional records are loaded" : "A clean ledger for your own entries"}</small></span>
              <button
                type="button"
                onClick={() => {
                  onToggleMode();
                  if (isDemoMode) {
                    setName(""); setPhone(""); setCounty("Nairobi");
                  } else {
                    setName("Amina M."); setPhone("0712 345 678"); setCounty("Nairobi"); setSector("construction");
                  }
                }}
              >
                {isDemoMode ? "Start clean" : "Try demo"}
              </button>
            </div>
          )}

          <form id="worker-profile-form" onSubmit={handleSubmit} className="profile-form">
            <label className="profile-field profile-name-field">
              <span><User size={15} /> Preferred name <b>Required</b></span>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="For example, Amina M."
              aria-describedby="profile-name-help"
            />
              <small id="profile-name-help">Shown on your records. You can change it later.</small>
            </label>

            <div className="profile-field-grid">
            <label className="profile-field">
              <span><Briefcase size={15} /> Work sector</span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as KenyanSector)}
            >
              {SECTOR_IDS.map((value) => (
                <option key={value} value={value}>{SECTOR_CONFIGS[value].name} ({SECTOR_CONFIGS[value].nameSwahili})</option>
              ))}
            </select>
            </label>

            <label className="profile-field">
              <span><MapPin size={15} /> County or town</span>
            <input
              type="text"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="For example, Nairobi"
            />
            </label>
            </div>

            <label className="profile-field">
              <span><Phone size={15} /> Phone or M-Pesa number <i>Optional</i></span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="For example, 0712 345 678"
              aria-describedby="profile-phone-help"
            />
              <small id="profile-phone-help">Helps match payment proof to your records.</small>
            </label>

            <p className="profile-privacy-note"><ShieldCheck size={16} /><span><b>Saved on this device.</b> Profile details are uploaded only if you choose cloud backup.</span></p>

          {error && (
              <div className="profile-error" role="alert">{error}</div>
          )}
          </form>
        </div>

        <footer className="profile-sheet-footer">
            <Button
              type="submit"
              form="worker-profile-form"
              variant="iosPrimary"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                "Saving…"
              ) : (
                <>
                  <Check size={18} /> {isFirstVisit ? "Create my work record" : "Save changes"}
                </>
              )}
            </Button>
            <button type="button" className="profile-cancel" onClick={onClose}>{isFirstVisit ? "I’ll do this later" : "Cancel"}</button>
        </footer>
      </div>
    </div>
  );
}
