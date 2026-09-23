"use client";

import { useState } from "react";
import { AlertCircle, Check, CloudDownload, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  normalizeKenyanPhone,
  requestBackupRecoveryCode,
  restoreBackupWithOtp,
} from "@/utils/supabase/recovery";

interface BackupRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: (counts: { shifts: number; incidents: number; evidence: number }) => void;
}

export function BackupRecoveryModal({ isOpen, onClose, onRestored }: BackupRecoveryModalProps) {
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleRequestCode() {
    setMessage("");
    const normalizedPhone = normalizeKenyanPhone(phone);
    if (!normalizedPhone) {
      setMessage("Enter a valid linked phone number, such as 0712 345 678 or +254 712 345 678.");
      return;
    }
    const normalizedId = nationalId.replace(/\D/g, "");
    if (!/^\d{6,10}$/.test(normalizedId)) {
      setMessage("Enter the 6 to 10 digit ID number saved in your worker profile.");
      return;
    }
    if (!/^\d{4,8}$/.test(pin)) {
      setMessage("Enter the 4 to 8 digit Vault PIN you set before backing up.");
      return;
    }

    setIsWorking(true);
    try {
      await requestBackupRecoveryCode(normalizedPhone);
      setPhone(normalizedPhone);
      setIsCodeSent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send a verification code.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRestore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!/^\d{4,8}$/.test(otp)) {
      setMessage("Enter the SMS verification code.");
      return;
    }
    setIsWorking(true);
    try {
      const counts = await restoreBackupWithOtp({
        phone,
        token: otp,
        nationalId,
        pin,
      });
      setIsSuccess(true);
      setMessage(`Restored ${counts.shifts} shifts, ${counts.incidents} incidents, and ${counts.evidence} evidence files.`);
      onRestored(counts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not restore the backup.");
    } finally {
      setIsWorking(false);
    }
  }

  function resetFlow() {
    setIsCodeSent(false);
    setIsSuccess(false);
    setOtp("");
    setMessage("");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="backup-recovery-title">
      <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><CloudDownload size={21} /></div>
          <div className="min-w-0 flex-1">
            <h2 id="backup-recovery-title" className="text-base font-bold text-gray-950">Request backed-up data</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">Verify your linked phone, ID number, and Vault PIN to restore records from Supabase.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100"><X size={18} /></button>
        </header>

        <form onSubmit={handleRestore} className="space-y-4 p-5">
          <div className="flex gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-[11px] leading-relaxed text-blue-950">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-700" />
            <span>First enter your details and request an SMS code. Your ID number and PIN are checked on this device and are never sent to Supabase.</span>
          </div>

          <label className="block text-xs font-semibold text-gray-700">
            Phone linked to your backup
            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0712 345 678 or +254 712 345 678" disabled={isWorking || isCodeSent} className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-normal text-gray-950 outline-none focus:border-blue-500 focus:bg-white" required />
          </label>

          <label className="block text-xs font-semibold text-gray-700">
            National ID number
            <input type="password" inputMode="numeric" autoComplete="off" value={nationalId} onChange={(event) => setNationalId(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="6–10 digits" disabled={isWorking || isCodeSent} className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-normal text-gray-950 outline-none focus:border-blue-500 focus:bg-white" required />
          </label>

          <label className="block text-xs font-semibold text-gray-700">
            Vault PIN
            <input type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="4–8 digits" disabled={isWorking || isCodeSent} className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-normal text-gray-950 outline-none focus:border-blue-500 focus:bg-white" required />
          </label>

          {isCodeSent && !isSuccess && (
            <label className="block text-xs font-semibold text-gray-700">
              SMS verification code
              <input type="text" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Enter the code" disabled={isWorking} className="mt-1.5 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-center text-lg tracking-[0.35em] text-gray-950 outline-none focus:border-blue-500 focus:bg-white" required />
            </label>
          )}

          {message && (
            <div role={isSuccess ? "status" : "alert"} className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              {isSuccess ? <Check size={15} className="mt-0.5 shrink-0" /> : <AlertCircle size={15} className="mt-0.5 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="iosPlain" onClick={onClose} className="flex-1" disabled={isWorking}>Close</Button>
            {!isCodeSent ? (
              <Button type="button" variant="iosPrimary" onClick={handleRequestCode} disabled={isWorking} className="flex-[1.5]">
                {isWorking ? <><LoaderCircle size={16} className="animate-spin" /> Sending code…</> : "Request recovery code"}
              </Button>
            ) : isSuccess ? (
              <Button type="button" variant="iosPrimary" onClick={onClose} className="flex-[1.5]">Done</Button>
            ) : (
              <Button type="submit" variant="iosPrimary" disabled={isWorking || otp.length < 4} className="flex-[1.5]">
                {isWorking ? <><LoaderCircle size={16} className="animate-spin" /> Restoring…</> : "Restore my backup"}
              </Button>
            )}
          </div>
          {isCodeSent && !isSuccess && <button type="button" onClick={resetFlow} className="w-full text-center text-xs font-semibold text-blue-700 hover:text-blue-900" disabled={isWorking}>Change phone or details</button>}
        </form>
      </div>
    </div>
  );
}
