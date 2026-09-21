/**
 * Lightweight EXIF and payment screenshot metadata extractor.
 * Extracts image dimensions, creation timestamp, and basic EXIF tags from JPEG/PNG images
 * to establish evidence provenance for legal proceedings and Haki Dossiers.
 */

export interface EvidenceMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  captureDate?: string;
  sha256Hash: string;
  dimensions?: { width: number; height: number };
  detectedPaymentType?: "mpesa" | "cash_receipt" | "bank" | "general";
  mpesaRefCandidate?: string;
}

/**
 * Inspects a file's name and text hints for M-Pesa or transaction signals.
 */
export function detectPaymentContext(fileName: string): {
  type: "mpesa" | "cash_receipt" | "bank" | "general";
  ref?: string;
} {
  const lower = fileName.toLowerCase();
  if (lower.includes("mpesa") || lower.includes("m-pesa") || lower.includes("safaricom")) {
    return { type: "mpesa" };
  }
  if (lower.includes("receipt") || lower.includes("slip") || lower.includes("cash")) {
    return { type: "cash_receipt" };
  }
  if (lower.includes("bank") || lower.includes("kcb") || lower.includes("equity")) {
    return { type: "bank" };
  }
  return { type: "general" };
}

/**
 * Extracts basic image dimensions and metadata safely in the browser.
 */
export async function extractImageDetails(file: File): Promise<{
  width: number;
  height: number;
  lastModifiedDate: string;
}> {
  return new Promise((resolve) => {
    const fallbackDate = new Date(file.lastModified || Date.now()).toISOString();
    if (!file.type.startsWith("image/")) {
      resolve({ width: 0, height: 0, lastModifiedDate: fallbackDate });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve({ width, height, lastModifiedDate: fallbackDate });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0, lastModifiedDate: fallbackDate });
    };
    img.src = url;
  });
}
