"use client";

import React, { useState } from "react";
import { Phone, MessageSquare, X, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftLoggedFromUssd: (shift: {
    employer: string;
    agreed: number;
    paid: number;
    start: string;
    end: string;
    location: string;
  }) => void;
}

export function FeaturePhoneModal({
  isOpen,
  onClose,
  onShiftLoggedFromUssd,
}: FeaturePhoneModalProps) {
  const [channel, setChannel] = useState<"ussd" | "whatsapp">("ussd");

  // USSD State Machine
  const [ussdStep, setUssdStep] = useState<number>(0);
  const [ussdInput, setUssdInput] = useState("");
  const [tempShift, setTempShift] = useState({
    employer: "Site Contractor",
    agreed: 1200,
    paid: 1000,
    start: "08:00",
    end: "17:30",
    location: "Kibera / Kilimani",
  });

  // WhatsApp bot State
  const [waMessages, setWaMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    {
      sender: "bot",
      text: "Hujambo! Fairwork Pulse WhatsApp Intake Bot. Forward your M-Pesa SMS or type: SHIFT [Employer] [Agreed] [Paid] [Hours]",
    },
    {
      sender: "user",
      text: "SHIFT KaribuBuilders 1200 1000 9.5",
    },
    {
      sender: "bot",
      text: "✅ Zamu imehifadhiwa! Agreed: KSh 1,200 | Paid: KSh 1,000 | Overtime: 1.5 hrs. Indicative Claim: KSh 425. Your record is encrypted in your vault.",
    },
  ]);
  const [waInput, setWaInput] = useState("");

  if (!isOpen) return null;

  function handleUssdSend(e: React.FormEvent) {
    e.preventDefault();
    const val = ussdInput.trim();
    setUssdInput("");

    if (ussdStep === 0) {
      if (val === "1") {
        setUssdStep(1); // Ask employer
      } else if (val === "2") {
        setUssdStep(10); // Balance check
      } else {
        setUssdStep(0);
      }
    } else if (ussdStep === 1) {
      setTempShift((prev) => ({ ...prev, employer: val || "Construction Site" }));
      setUssdStep(2); // Ask agreed pay
    } else if (ussdStep === 2) {
      setTempShift((prev) => ({ ...prev, agreed: Number(val) || 1200 }));
      setUssdStep(3); // Ask paid amount
    } else if (ussdStep === 3) {
      const finalPaid = Number(val) || 1000;
      setTempShift((prev) => ({ ...prev, paid: finalPaid }));
      onShiftLoggedFromUssd({
        ...tempShift,
        paid: finalPaid,
      });
      setUssdStep(4); // Confirmation
    }
  }

  function handleWaSend(e: React.FormEvent) {
    e.preventDefault();
    if (!waInput.trim()) return;

    const userText = waInput.trim();
    setWaMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setWaInput("");

    // Check if input is a SHIFT command: SHIFT [Employer] [Agreed] [Paid] [Hours]
    const shiftMatch = userText.match(/shift\s+([a-zA-Z0-9_\-\s]+?)\s+(\d+)\s+(\d+)(?:\s+([\d\.]+))?/i);
    if (shiftMatch) {
      const employer = shiftMatch[1].trim();
      const agreed = Number(shiftMatch[2]);
      const paid = Number(shiftMatch[3]);
      const hours = shiftMatch[4] ? Number(shiftMatch[4]) : 8;
      const otHours = Math.max(0, hours - 8);
      const shortfall = Math.max(0, agreed - paid);
      const hourlyRate = agreed / 8;
      const otClaim = otHours * hourlyRate * 1.5;
      const totalClaim = shortfall + otClaim;

      onShiftLoggedFromUssd({
        employer,
        agreed,
        paid,
        start: "08:00",
        end: hours > 8 ? `${8 + Math.floor(hours)}:${Math.round((hours % 1) * 60).toString().padStart(2, "0")}` : "17:00",
        location: "WhatsApp Intake",
      });

      setTimeout(() => {
        setWaMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `✅ Zamu imehifadhiwa! Mwajiri: ${employer} | Agreed: KSh ${agreed.toLocaleString()} | Paid: KSh ${paid.toLocaleString()}${
              otHours > 0 ? ` | Overtime: ${otHours.toFixed(1)} hrs` : ""
            }. Indicative Claim: KSh ${Math.round(totalClaim).toLocaleString()}. Record has been saved to your Fairwork Pulse ledger.`,
          },
        ]);
      }, 500);
      return;
    }

    // Default fallback acknowledgement
    setTimeout(() => {
      setWaMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "✅ Tumepokea ujumbe wako! Type: SHIFT [Employer] [Agreed] [Paid] [Hours] to record a shift, or dial *384*2026# on your phone.",
        },
      ]);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-stone-900 text-white rounded-3xl p-5 shadow-2xl border border-stone-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-amber-400" />
            <div>
              <h3 className="text-sm font-bold leading-tight">Feature-Phone Intake (Kitochi)</h3>
              <p className="text-[10px] text-stone-400">Offline 2G USSD & WhatsApp Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800"
          >
            <X size={17} />
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="flex rounded-xl bg-stone-800 p-1 my-3 text-xs">
          <button
            onClick={() => setChannel("ussd")}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              channel === "ussd" ? "bg-amber-400 text-stone-950 shadow-sm" : "text-stone-400 hover:text-white"
            }`}
          >
            <Phone size={13} /> USSD (*384*2026#)
          </button>
          <button
            onClick={() => setChannel("whatsapp")}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              channel === "whatsapp" ? "bg-emerald-500 text-white shadow-sm" : "text-stone-400 hover:text-white"
            }`}
          >
            <MessageSquare size={13} /> WhatsApp Bot
          </button>
        </div>

        {/* Content Area */}
        {channel === "ussd" ? (
          <div className="space-y-3">
            <div className="bg-emerald-950/80 border-2 border-emerald-500/40 rounded-2xl p-4 font-mono text-emerald-300 text-xs min-h-[170px] shadow-inner flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-emerald-500 uppercase tracking-widest block mb-1">
                  USSD Session: *384*2026#
                </span>

                {ussdStep === 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-white">FAIRWORK PULSE</p>
                    <p>1. Weka Zamu ya Leo (Log Shift)</p>
                    <p>2. Angalia Madai (Check Balance)</p>
                    <p>3. Ripoti Jeraha (WIBA Injury)</p>
                  </div>
                )}

                {ussdStep === 1 && (
                  <div>
                    <p className="font-bold text-white">Andika Jina la Mwajiri / Site:</p>
                    <p className="text-[11px] text-emerald-400 mt-1">(e.g. Karibu Builders, Kilimani)</p>
                  </div>
                )}

                {ussdStep === 2 && (
                  <div>
                    <p className="font-bold text-white">Mlikubaliana KSh ngapi leo?</p>
                    <p className="text-[11px] text-emerald-400 mt-1">(Agreed Daily Pay in KSh)</p>
                  </div>
                )}

                {ussdStep === 3 && (
                  <div>
                    <p className="font-bold text-white">Umelipwa KSh ngapi mkononi?</p>
                    <p className="text-[11px] text-emerald-400 mt-1">(Amount paid by cash/M-Pesa)</p>
                  </div>
                )}

                {ussdStep === 4 && (
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-200">✅ ZAMU IMEHIFADHIWA!</p>
                    <p>Mwajiri: {tempShift.employer}</p>
                    <p>Agreed: KSh {tempShift.agreed} | Paid: KSh {tempShift.paid}</p>
                    <p className="text-amber-300">Upungufu: KSh {Math.max(0, tempShift.agreed - tempShift.paid)}</p>
                    <p className="text-[10px] text-emerald-400 mt-1">Synced to your local vault.</p>
                  </div>
                )}

                {ussdStep === 10 && (
                  <div className="space-y-1">
                    <p className="font-bold text-white">JALADA LAKO LA HAKI:</p>
                    <p>Total Claim: KSh 1,425</p>
                    <p>Overtime: 2.5 hrs</p>
                    <p>Dial *384*2026*1# to add shift</p>
                  </div>
                )}
              </div>

              {ussdStep < 4 ? (
                <form onSubmit={handleUssdSend} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={ussdInput}
                    onChange={(e) => setUssdInput(e.target.value)}
                    placeholder="Enter reply..."
                    autoFocus
                    className="flex-1 bg-black/50 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-400"
                  >
                    Send
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setUssdStep(0)}
                  className="w-full mt-2 bg-emerald-600/50 text-white text-xs py-1.5 rounded-lg hover:bg-emerald-600"
                >
                  Restart USSD Session
                </button>
              )}
            </div>
            <p className="text-[10px] text-stone-400 text-center">
              Works on Safaricom / Airtel 2G networks with zero mobile data.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3 h-52 overflow-y-auto space-y-2 text-xs">
              {waMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-2 rounded-xl text-[11px] leading-relaxed ${
                      m.sender === "user"
                        ? "bg-emerald-700 text-white rounded-br-none"
                        : "bg-stone-800 text-stone-200 rounded-bl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleWaSend} className="flex gap-2">
              <input
                type="text"
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                placeholder="Send M-Pesa SMS or note..."
                className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-400"
              >
                Send
              </button>
            </form>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-amber-400" />
            End-to-end encrypted
          </span>
          <Button variant="iosPlain" size="sm" onClick={onClose} className="text-stone-300 hover:text-white text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
