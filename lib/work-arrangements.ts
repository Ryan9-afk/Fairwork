import type { KenyanSector } from "@/lib/legal-engine";

export const PAYMENT_BASES = ["salary", "hourly", "daily", "project", "mixed", "other", "unsure"] as const;
export type PaymentBasis = (typeof PAYMENT_BASES)[number];

export interface WorkArrangement {
  id: string;
  label: string;
  sector: KenyanSector;
  paymentBasis: PaymentBasis;
  employerOrClient?: string;
  /** Flexible, worker-confirmed context fields suggested by AI or added manually. */
  customFields?: Record<string, string>;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_BASIS_LABELS: Record<PaymentBasis, string> = {
  salary: "Monthly or regular salary",
  hourly: "Paid by the hour",
  daily: "Paid by the day or shift",
  project: "Paid per task or project",
  mixed: "A mix of payment types",
  other: "Another arrangement",
  unsure: "I’m not sure yet",
};

export function createArrangementId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "arr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
}

export function createWorkArrangement(input: Partial<WorkArrangement> = {}): WorkArrangement {
  const now = new Date().toISOString();
  return {
    id: input.id || createArrangementId(),
    label: input.label || "My work",
    sector: input.sector || "construction",
    paymentBasis: input.paymentBasis || "unsure",
    employerOrClient: input.employerOrClient,
    customFields: input.customFields || {},
    confirmed: input.confirmed ?? false,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function routeSectorFromText(text: string): KenyanSector | null {
  const value = text.toLowerCase();
  if (/construction|builder|foreman|mason|fund[io]|mjengo|site/.test(value)) return "construction";
  if (/farm|agri|tea|harvest|crop|field|shamba|pick/.test(value)) return "agriculture";
  if (/domestic|household|caregiver|nanny|househelp|cleaner|nyumbani/.test(value)) return "domestic";
  if (/delivery|boda|rider|courier|platform|gig|errand|runner|uber|bolt|glovo|jiji/.test(value)) return "gig_delivery";
  return null;
}
