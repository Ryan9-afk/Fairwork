/**
 * Dynamic Kenyan Legal Rules Engine for Fairwork Pulse.
 * Computes sector-specific minimum wage thresholds, overtime entitlements,
 * and statutory citations according to the Employment Act 2007,
 * Regulation of Wages (General) Order, and sectoral wage orders.
 */

export type KenyanSector = "construction" | "agriculture" | "domestic" | "gig_delivery";

export interface SectorRuleConfig {
  id: KenyanSector;
  name: string;
  nameSwahili: string;
  dailyMinimumBaseline: number; // in KSh
  standardDailyHours: number;
  normalOvertimeMultiplier: number;
  restDayOvertimeMultiplier: number;
  housingAllowanceEligible: boolean;
  statutoryCitations: {
    act: string;
    sections: string;
    title: string;
  }[];
  notes: string;
  notesSwahili: string;
}

export const SECTOR_CONFIGS: Record<KenyanSector, SectorRuleConfig> = {
  construction: {
    id: "construction",
    name: "Construction & Artisans",
    nameSwahili: "Ujenzi na Mafundi",
    dailyMinimumBaseline: 1200,
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    housingAllowanceEligible: false,
    statutoryCitations: [
      {
        act: "Employment Act, 2007",
        sections: "§§ 17–19",
        title: "Prompt payment of wages and prohibition of unlawful deductions",
      },
      {
        act: "Regulation of Wages (General) Order",
        sections: "Rules 5–6",
        title: "Standard working hours and 1.5× / 2.0× overtime multipliers",
      },
      {
        act: "Work Injury Benefits Act (WIBA), 2007",
        sections: "§§ 10, 16",
        title: "Employer liability for site injuries and medical expenses",
      },
    ],
    notes: "Overtime applies beyond 8 hours. Work on Sunday or public holidays entitles worker to double time (2.0×).",
    notesSwahili: "Saa za ziada huhesabiwa baada ya saa 8. Kazi ya Jumapili au sikukuu hulipwa mara mbili (2.0×).",
  },
  agriculture: {
    id: "agriculture",
    name: "Agriculture & Tea Picking",
    nameSwahili: "Kilimo na Uchumaji Chai",
    dailyMinimumBaseline: 950,
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    housingAllowanceEligible: true,
    statutoryCitations: [
      {
        act: "Regulation of Wages (Agricultural Industry) Order",
        sections: "Schedules 1–2",
        title: "Minimum wages and basic terms in agricultural undertakings",
      },
      {
        act: "Employment Act, 2007",
        sections: "§ 27",
        title: "Right to weekly rest day of at least 24 consecutive hours",
      },
      {
        act: "Employment Act, 2007",
        sections: "§ 31",
        title: "Housing entitlement or reasonable housing allowance",
      },
    ],
    notes: "Agricultural tasks often combine piece rates. Overtime is payable on excess hours beyond agreed daily allotment.",
    notesSwahili: "Kazi za kilimo zikivuka kipimo cha siku, saa za ziada zinalipwa kisheria kwa kiwango cha 1.5× au 2.0×.",
  },
  domestic: {
    id: "domestic",
    name: "Domestic & Care Workers",
    nameSwahili: "Wafanyakazi wa Nyumbani",
    dailyMinimumBaseline: 650, // Approx ~15,200/mo city rate divided by 24 working days
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    housingAllowanceEligible: true,
    statutoryCitations: [
      {
        act: "Regulation of Wages (General) Order",
        sections: "Part II (Domestic Staff)",
        title: "Urban minimum wage schedule for domestic servants",
      },
      {
        act: "Employment Act, 2007",
        sections: "§§ 5, 29",
        title: "Protection from maternity discrimination and 3-month paid leave",
      },
      {
        act: "Employment Act, 2007",
        sections: "§ 31",
        title: "Employer must provide reasonable housing or 15% housing allowance",
      },
    ],
    notes: "Urban domestic workers are entitled to gazetted minimum pay plus housing allowance if living out.",
    notesSwahili: "Wafanyakazi wa nyumbani mijini wanastahili kima cha chini kilichotangazwa na serikali pamoja na posho ya nyumba.",
  },
  gig_delivery: {
    id: "gig_delivery",
    name: "Gig Delivery & Boda Boda",
    nameSwahili: "Waendesha Boda na Usafirishaji",
    dailyMinimumBaseline: 1100,
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    housingAllowanceEligible: false,
    statutoryCitations: [
      {
        act: "Employment Act, 2007",
        sections: "§§ 8–10",
        title: "Contract particulars and worker classification safeguards",
      },
      {
        act: "Employment Act, 2007",
        sections: "§§ 17–19",
        title: "Protection against arbitrary platform clawbacks and penalties",
      },
      {
        act: "Consumer Protection & Fair Labor Standards",
        sections: "Remedy Principles",
        title: "Contemporaneous logging of ride hours, fuel deductions and net remittance",
      },
    ],
    notes: "Platform deductions for app fees or vehicle lease must comply with lawful statutory limits.",
    notesSwahili: "Makato ya programu au ukodishaji wa pikipiki lazima yafuate sheria ya ajira bila dhuluma.",
  },
};

export interface ShiftAuditResult {
  totalHours: number;
  standardHours: number;
  overtimeHours: number;
  hourlyRate: number;
  wageDeficit: number;
  overtimePayDue: number;
  totalClaim: number;
  isMinimumWageShortfall: boolean;
  sectorName: string;
  citations: { act: string; sections: string; title: string }[];
  lineItems: AuditLineItem[];
  assumptions: string[];
  reviewStatus: "recorded" | "needs-review";
}

export interface AuditLineItem {
  id: "agreed-pay" | "payment-received" | "payment-gap" | "overtime-estimate";
  label: string;
  amount: number;
  kind: "recorded" | "estimate";
  explanation: string;
  ruleId?: string;
  sourceUrl?: string;
  reviewStatus: "recorded" | "needs-review";
}

export function parseHoursBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;

  let totalMinutes = eh * 60 + em - (sh * 60 + sm);
  if (totalMinutes < 0) {
    // Cross-midnight shift (e.g. 20:00 to 04:00)
    totalMinutes += 24 * 60;
  }
  return Math.max(0, totalMinutes / 60);
}

export function calculateSectorAudit(
  sector: KenyanSector,
  agreedPay: number,
  amountReceived: number,
  startTime: string,
  endTime: string,
  isSundayOrRestDay: boolean
): ShiftAuditResult {
  const config = SECTOR_CONFIGS[sector] || SECTOR_CONFIGS.construction;
  const totalHours = parseHoursBetween(startTime, endTime);
  const standardHours = Math.min(totalHours, config.standardDailyHours);
  const overtimeHours = Math.max(0, totalHours - config.standardDailyHours);

  // Hourly rate derived from agreed daily pay (or statutory baseline if agreed is zero)
  const effectiveDailyRate = agreedPay > 0 ? agreedPay : config.dailyMinimumBaseline;
  const hourlyRate = effectiveDailyRate / config.standardDailyHours;

  const multiplier = isSundayOrRestDay
    ? config.restDayOvertimeMultiplier
    : config.normalOvertimeMultiplier;

  const overtimePayDue = overtimeHours * hourlyRate * multiplier;
  const wageDeficit = Math.max(0, agreedPay - amountReceived);
  const totalClaim = wageDeficit + overtimePayDue;
  const isMinimumWageShortfall = agreedPay < config.dailyMinimumBaseline;

  return {
    totalHours,
    standardHours,
    overtimeHours,
    hourlyRate,
    wageDeficit,
    overtimePayDue,
    totalClaim,
    isMinimumWageShortfall,
    sectorName: config.name,
    citations: config.statutoryCitations,
    lineItems: [
      { id: "agreed-pay", label: "Agreed pay", amount: agreedPay, kind: "recorded", explanation: "The amount entered as agreed for this shift.", reviewStatus: "recorded" },
      { id: "payment-received", label: "Payment recorded", amount: amountReceived, kind: "recorded", explanation: "The amount entered as received for this shift.", reviewStatus: "recorded" },
      { id: "payment-gap", label: "Unpaid agreed amount", amount: wageDeficit, kind: "recorded", explanation: "Agreed pay minus the payment recorded, never below zero.", ruleId: "EMP-17-19", sourceUrl: "https://new.kenyalaw.org/akn/ke/act/2007/11/eng@2012-01-02", reviewStatus: "recorded" },
      { id: "overtime-estimate", label: "Estimated additional entitlement", amount: overtimePayDue, kind: "estimate", explanation: `${overtimeHours.toFixed(1)} hours above ${config.standardDailyHours} hours, using a ${multiplier.toFixed(1)}x multiplier and an hourly rate derived from the entered daily pay.`, ruleId: "WAGES-R5-6", sourceUrl: "https://new.kenyalaw.org/", reviewStatus: "needs-review" },
    ],
    assumptions: [
      "Times entered represent working time; unpaid breaks have not been deducted.",
      "The entered agreed pay is used to derive the hourly rate.",
      "Overtime and minimum-wage treatment can vary by occupation, location, and current wage order.",
    ],
    reviewStatus: overtimePayDue > 0 || isMinimumWageShortfall ? "needs-review" : "recorded",
  };
}
