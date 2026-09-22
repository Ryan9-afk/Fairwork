"use client";

import React, { useState, useRef } from "react";
import { Camera, ShieldCheck, X, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveEvidenceAttachment, EvidenceAttachment } from "@/lib/vault-db";
import { computeSha256 } from "@/lib/crypto";

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: number | string;
  parentType: "shift" | "incident";
  onAttachmentSaved: (attachment: EvidenceAttachment) => void;
  initialTypeHint?: "payment" | "injury" | "general";
  vaultKey?: CryptoKey | null;
  arrangementId?: string;
}

export function EvidenceModal({
  isOpen,
  onClose,
  parentId,
  parentType,
  onAttachmentSaved,
  initialTypeHint = "payment",
  vaultKey,
  arrangementId,
}: EvidenceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sha256, setSha256] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsProcessing(true);

    try {
      // Generate preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selected);

      // Compute immediate SHA-256
      const arrayBuffer = await selected.arrayBuffer();
      const hash = await computeSha256(arrayBuffer);
      setSha256(hash);
    } catch {
      console.error("Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSave() {
    if (!file) return;

    setIsProcessing(true);
    try {
      const saved = await saveEvidenceAttachment(
        file,
        parentType,
        parentId,
        notes,
        vaultKey,
        arrangementId
      );
      onAttachmentSaved(saved);
      onClose();
      // Reset state
      setFile(null);
      setPreviewUrl(null);
      setSha256("");
      setNotes("");
    } catch (err) {
      console.error("Error saving evidence:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-none">
                {initialTypeHint === "payment" ? "Attach Payment Proof" : "Attach Evidence"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                M-Pesa screenshot, cash voucher, or site photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud size={24} />
              </div>
              <strong className="text-sm font-semibold text-gray-800">
                Choose Screenshot or Take Photo
              </strong>
              <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                M-Pesa SMS confirmation, site badges, or clinic receipts
              </p>
              <span className="mt-3 text-[11px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Browse Files
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-56 flex items-center justify-center">
                {file?.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Evidence preview"
                    className="object-contain max-h-56 w-auto"
                  />
                ) : (
                  <div className="p-8 flex flex-col items-center">
                    <FileText size={36} className="text-gray-400 mb-2" />
                    <span className="text-xs font-medium text-gray-700">{file?.name}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setSha256("");
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <X size={15} />
                </button>
              </div>

              {sha256 && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                      SHA-256 File Integrity Hash
                    </span>
                    <code className="text-[10px] text-emerald-700 font-mono break-all leading-tight block">
                      {sha256}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-1">
            <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. M-Pesa transaction code QB72XY9 or cash balance note"
              className="w-full text-xs h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex gap-2">
          <Button
            type="button"
            variant="iosPlain"
            onClick={onClose}
            className="flex-1 text-xs text-gray-500"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="iosPrimary"
            disabled={!file || isProcessing}
            onClick={handleSave}
            className="flex-1"
          >
            {isProcessing ? "Processing..." : "Save to Vault"}
          </Button>
        </div>
      </div>
    </div>
  );
}
