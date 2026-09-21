"use client";

import React, { useState } from "react";
import { Lock, Unlock, ShieldAlert, KeyRound, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VaultLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  onUnlock: (pin: string) => Promise<boolean>;
  onSetupPin: (pin: string) => Promise<boolean>;
}

export function VaultLockModal({
  isOpen,
  onClose,
  isConfigured,
  onUnlock,
  onSetupPin,
}: VaultLockModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    setLoading(true);
    try {
      if (!isConfigured) {
        if (pin !== confirmPin) {
          setError("PINs do not match");
          setLoading(false);
          return;
        }
        const ok = await onSetupPin(pin);
        if (ok) {
          setPin("");
          setConfirmPin("");
          onClose();
        } else {
          setError("Failed to initialize encrypted vault");
        }
      } else {
        const ok = await onUnlock(pin);
        if (ok) {
          setPin("");
          onClose();
        } else {
          setError("Incorrect PIN. Please try again.");
        }
      }
    } catch {
      setError("Crypto operation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-inner">
          {isConfigured ? <Lock size={28} /> : <KeyRound size={28} />}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {isConfigured ? "Unlock Encrypted Vault" : "Set Vault Security PIN"}
        </h3>

        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          {isConfigured
            ? "Your wage rates, cash received, and incident notes are encrypted on-device with AES-GCM-256."
            : "Protect sensitive wages and evidence with a local master PIN. Nothing unencrypted ever leaves this device."}
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              {isConfigured ? "Enter 4–6 Digit PIN" : "New Security PIN"}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full h-12 text-center text-2xl tracking-[0.4em] font-mono rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              required
            />
          </div>

          {!isConfigured && (
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                Confirm PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full h-12 text-center text-2xl tracking-[0.4em] font-mono rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
              <ShieldAlert size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              variant="iosPrimary"
              disabled={loading || pin.length < 4}
              className="w-full h-12"
            >
              {loading ? (
                "Deriving Key..."
              ) : isConfigured ? (
                <>
                  <Unlock size={18} /> Unlock Vault
                </>
              ) : (
                <>
                  <Check size={18} /> Initialize Vault
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="iosPlain"
              onClick={onClose}
              className="w-full text-xs text-gray-500"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
