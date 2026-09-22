/**
 * Kenyan work-record rules engine for Fairwork Pulse.
 * Computes recorded wage gaps and estimated overtime entitlements from the
 * worker's own entered figures. It does NOT compare pay against statutory
 * minimum wages: a worker may have freely agreed a different price, so the
 * engine treats the entered agreed pay as the basis and leaves legal
 * entitlement to human review.
 *
 * Statutory references (Employment Act 2007, Regulation of Wages (General)
 * Order, WIBA 2007) are supplied as context for review, not as a determination.
 */

/**
 * Single source of truth for work categories. Add a new category here and
 * every consumer (legal engine, AI contracts, sector agents, UI selectors)
 * picks it up automatically.
 */
export const SECTOR_IDS = [
  "construction",
  "agriculture",
  "domestic",
  "gig_delivery",
  "office_professional",
  "retail_hospitality",
  "security",
  "manufacturing",
  "general_labour",
  "cleaning_facility",
  "healthcare_care",
  "transport_psv",
  // Freeform bucket used when the worker or the AI describes work that does not
  // match a listed category. The specific name lives on the arrangement label.
  "other",
] as const;

export type KenyanSector = (typeof SECTOR_IDS)[number];

export interface StatutoryCitation {
  act: string;
  sections: string;
  title: string;
}

export interface SectorRuleConfig {
  id: KenyanSector;
  name: string;
  nameSwahili: string;
  standardDailyHours: number;
  normalOvertimeMultiplier: number;
  restDayOvertimeMultiplier: number;
  statutoryCitations: StatutoryCitation[];
  notes: string;
  notesSwahili: string;
}

const EMPLOYMENT_ACT: StatutoryCitation = {
  act: "Employment Act, 2007",
  sections: "§§ 17–19",
  title: "Prompt payment of wages and prohibition of unlawful deductions",
};

const WAGES_OVERTIME: StatutoryCitation = {
  act: "Regulation of Wages (General) Order",
  sections: "Rules 5–6",
  title: "Standard working hours and the 1.5× / 2.0× overtime multipliers",
};

const REST_DAY: StatutoryCitation = {
  act: "Employment Act, 2007",
  sections: "§ 27",
  title: "Right to a weekly rest day of at least 24 consecutive hours",
};

const WIBA: StatutoryCitation = {
  act: "Work Injury Benefits Act (WIBA), 2007",
  sections: "§§ 10, 16",
  title: "Employer liability for work injuries and medical expenses",
};

const HOUSING: StatutoryCitation = {
  act: "Employment Act, 2007",
  sections: "§ 31",
  title: "Housing entitlement or reasonable housing allowance",
};

export const SECTOR_CONFIGS: Record<KenyanSector, SectorRuleConfig> = {
  construction: {
    id: "construction",
    name: "Construction & artisans",
    nameSwahili: "Ujenzi na Mafundi",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME, WIBA],
    notes: "Overtime is estimated for hours beyond 8 per day. Work on a Sunday or public holiday uses double time (2.0×).",
    notesSwahili: "Saa za ziada huhesabiwa baada ya saa 8. Kazi ya Jumapili au sikukuu hulipwa mara mbili (2.0×).",
  },
  agriculture: {
    id: "agriculture",
    name: "Agriculture & tea",
    nameSwahili: "Kilimo na Uchumaji Chai",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME, REST_DAY],
    notes: "Piece-rate and harvest work often combines with time pay. Overtime is estimated only for hours recorded beyond the entered working time.",
    notesSwahili: "Kazi za kipimo huambatana na malipo ya muda. Saa za ziada huhesabiwa tu kwa saa zilizoandikwa.",
  },
  domestic: {
    id: "domestic",
    name: "Domestic & care work",
    nameSwahili: "Wafanyakazi wa Nyumbani",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, REST_DAY, HOUSING],
    notes: "Record monthly, weekly, or daily pay as agreed. Overtime is estimated from the agreed rate; housing and meals are recorded separately.",
    notesSwahili: "Andika malipo ya mwezi, wiki, au siku kama mlivyokubaliana. Saa za ziada huhesabiwa kutoka kiwango mlivyokubaliana.",
  },
  gig_delivery: {
    id: "gig_delivery",
    name: "Gig delivery & boda boda",
    nameSwahili: "Waendesha Boda na Usafirishaji",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WIBA],
    notes: "Record gross earnings, deductions, fuel, and net payment separately. Platform fees and penalties are recorded, not judged.",
    notesSwahili: "Andika mapato, makato, mafuta, na malipo halisi tofauti. Makato ya programu huandikwa, hayahukumiwi.",
  },
  office_professional: {
    id: "office_professional",
    name: "Office & professional",
    nameSwahili: "Ofisi na Wataalamu",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME, REST_DAY],
    notes: "Salaried or contract office work. Record the agreed pay period and any unpaid additional hours for review.",
    notesSwahili: "Kazi ya ofisi kwa mshahara au mkataba. Andika kipindi cha malipo na saa za ziada zisizolipwa kwa mapitio.",
  },
  retail_hospitality: {
    id: "retail_hospitality",
    name: "Retail, hotels & catering",
    nameSwahili: "Duka, Hoteli na Mikahawa",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME, REST_DAY],
    notes: "Shift and tip-inclusive pay should be recorded separately. Public-holiday and split-shift work is flagged for review.",
    notesSwahili: "Malipo ya zamu na bakshishi huandikwa tofauti. Kazi ya sikukuu na zamu zilizogawanyika huwekwa kwa mapitio.",
  },
  security: {
    id: "security",
    name: "Private security",
    nameSwahili: "Ulinzi wa Kibinafsi",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME, WIBA],
    notes: "Long and night shifts are common. Record actual start and end times so night and rest-day hours are captured for review.",
    notesSwahili: "Zamu ndefu na za usiku ni za kawaida. Andika muda halisi ili saa za usiku na mapumziko ziandikwe.",
  },
  manufacturing: {
    id: "manufacturing",
    name: "Manufacturing & warehousing",
    nameSwahili: "Uzalishaji na Ghala",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME, WIBA],
    notes: "Production-line, shift, and piece work. Record output-based pay and any unpaid extra hours separately.",
    notesSwahili: "Kazi ya mstari, zamu, na kipimo. Andika malipo ya kipimo na saa za ziada tofauti.",
  },
  general_labour: {
    id: "general_labour",
    name: "General labour & casual work",
    nameSwahili: "Kazi za Kawaida",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME],
    notes: "For casual or general work with no specific industry. Record the task, agreed pay, and amount received.",
    notesSwahili: "Kwa kazi za kawaida bila tasnia maalum. Andika kazi, malipo yaliyokubaliwa, na kiasi kilichopokelewa.",
  },
  cleaning_facility: {
    id: "cleaning_facility",
    name: "Cleaning & facility services",
    nameSwahili: "Usafi na Huduma za Jengo",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME],
    notes: "Record the site, shift, and any extra hours worked outside the agreed schedule.",
    notesSwahili: "Andika eneo, zamu, na saa za ziada nje ya ratiba iliyokubaliwa.",
  },
  healthcare_care: {
    id: "healthcare_care",
    name: "Healthcare & care work",
    nameSwahili: "Afya na Utunzaji",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME, REST_DAY],
    notes: "Shift, on-call, and night work. Record actual hours and any unpaid call-out time for review.",
    notesSwahili: "Zamu, simu za kazini, na kazi ya usiku. Andika saa halisi na muda wa wito bila malipo.",
  },
  transport_psv: {
    id: "transport_psv",
    name: "Transport & PSV",
    nameSwahili: "Usafiri wa Matatu",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WIBA],
    notes: "Daily target or commission-based pay. Record the target, the collections, and the amount actually received.",
    notesSwahili: "Lengo la siku au kwa kamisheni. Andika lengo, makusanyo, na kiasi kilichopokelewa.",
  },
  other: {
    id: "other",
    name: "Other work",
    nameSwahili: "Kazi Nyingine",
    standardDailyHours: 8,
    normalOvertimeMultiplier: 1.5,
    restDayOvertimeMultiplier: 2.0,
    statutoryCitations: [EMPLOYMENT_ACT, WAGES_OVERTIME],
    notes: "A flexible record for work that does not match a listed category. Use the arrangement name to describe it.",
    notesSwahili: "Rekodi rahisi kwa kazi isiyolingana na kundi lolote. Tumia jina la mpango kuieleza.",
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
  sectorName: string;
  citations: StatutoryCitation[];
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

export function isKenyanSector(value: unknown): value is KenyanSector {
  return typeof value === "string" && (SECTOR_IDS as readonly string[]).includes(value);
}

export function getSectorConfig(sector: KenyanSector): SectorRuleConfig {
  return SECTOR_CONFIGS[sector] || SECTOR_CONFIGS.other;
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
  const config = getSectorConfig(sector);
  const totalHours = parseHoursBetween(startTime, endTime);
  const standardHours = Math.min(totalHours, config.standardDailyHours);
  const overtimeHours = Math.max(0, totalHours - config.standardDailyHours);

  // The hourly rate is derived from the worker's own agreed pay. When no agreed
  // pay is entered there is nothing to derive from, so overtime is estimated as
  // zero rather than inventing a statutory rate.
  const hourlyRate = agreedPay > 0 ? agreedPay / config.standardDailyHours : 0;

  const multiplier = isSundayOrRestDay
    ? config.restDayOvertimeMultiplier
    : config.normalOvertimeMultiplier;

  const overtimePayDue = overtimeHours * hourlyRate * multiplier;
  const wageDeficit = Math.max(0, agreedPay - amountReceived);
  const totalClaim = wageDeficit + overtimePayDue;

  return {
    totalHours,
    standardHours,
    overtimeHours,
    hourlyRate,
    wageDeficit,
    overtimePayDue,
    totalClaim,
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
      "No minimum-wage comparison is applied; the agreed pay entered is treated as the basis.",
    ],
    reviewStatus: overtimePayDue > 0 ? "needs-review" : "recorded",
  };
}
