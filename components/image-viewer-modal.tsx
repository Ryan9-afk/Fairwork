"use client";

import { EvidenceAttachment } from "@/lib/vault-db";
import {
  X,
  ShieldCheck,
  Download,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerModalProps {
  attachment: EvidenceAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function ImageViewerModal({
  attachment,
  isOpen,
  onClose,
  onDelete,
}: ImageViewerModalProps) {
  if (!isOpen || !attachment) return null;

  const isImage =
    attachment.mimeType?.startsWith("image/") ||
    attachment.dataUrl?.startsWith("data:image/");

  function downloadFile() {
    if (!attachment) return;
    const a = document.createElement("a");
    a.href = attachment.dataUrl;
    a.download = attachment.fileName || "fairwork-evidence.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const paymentTypeLabels: Record<string, string> = {
    mpesa: "M-Pesa SMS Confirmation",
    cash_receipt: "Cash Payment Receipt",
    bank: "Bank / Transfer Slip",
    general: "Site / Medical Evidence",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-viewer-title"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard size={17} />
            </span>
            <div className="truncate">
              <h3
                id="image-viewer-title"
                className="text-sm font-bold text-gray-900 truncate"
              >
                {attachment.fileName}
              </h3>
              <p className="text-[11px] text-gray-500 flex items-center gap-2">
                <span>{(attachment.fileSize / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>
                  {paymentTypeLabels[attachment.paymentType || "general"] || "Evidence"}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Image Display */}
        <div className="my-3 flex-1 min-h-48 max-h-72 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center relative border border-gray-800">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.dataUrl}
              alt={attachment.fileName}
              className="max-h-72 w-auto max-w-full object-contain"
            />
          ) : attachment.isEncrypted && !attachment.dataUrl ? (
            <div className="text-center p-6 text-amber-200">
              <ShieldCheck size={44} className="mx-auto mb-2 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold block text-white">Zero-Knowledge Encrypted</span>
              <span className="text-[11px] text-amber-300/80 max-w-xs block mx-auto mt-1">
                This evidence is encrypted with your master PIN (AES-GCM-256). Unlock the vault to preview.
              </span>
            </div>
          ) : (
            <div className="text-center p-6 text-gray-300">
              <FileText size={48} className="mx-auto mb-2 text-gray-400" />
              <span className="text-xs font-medium block">Document File</span>
              <span className="text-[11px] text-gray-500">
                Preview not available for this MIME type
              </span>
            </div>
          )}

          {/* Type Badge */}
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/10 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" />
            {attachment.paymentType || "General"}
          </span>
        </div>

        {/* Cryptographic SHA-256 Audit Stamp */}
        <div className="space-y-2 mb-3">
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-950">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck size={14} className="text-emerald-700" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Cryptographic Chain of Custody (SHA-256)
              </span>
            </div>
            <code className="text-[10px] font-mono break-all leading-tight text-emerald-800 block bg-white/70 px-2 py-1 rounded-md border border-emerald-100">
              {attachment.sha256Hash}
            </code>
          </div>

          {/* Notes or Metadata */}
          {attachment.notes && (
            <div className="px-3 py-2 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-100">
              <strong className="text-[10px] uppercase font-bold text-gray-400 block">
                Worker Note:
              </strong>
              <span>{attachment.notes}</span>
            </div>
          )}

          <div className="text-[11px] text-gray-400 flex items-center justify-between px-1">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Logged:{" "}
              {new Date(attachment.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Admissible Evidence
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
          {onDelete && (
            <Button
              variant="iosPlain"
              onClick={() => {
                onDelete(attachment.id);
                onClose();
              }}
              className="text-xs text-rose-600 hover:bg-rose-50 rounded-xl h-10 px-3"
            >
              Remove
            </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="iosTinted"
            onClick={downloadFile}
            className="text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl h-10 px-3 flex items-center gap-1.5"
          >
            <Download size={14} /> Download Original
          </Button>

          <Button
            variant="iosPrimary"
            onClick={onClose}
            className="text-xs rounded-xl h-10 px-4"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
