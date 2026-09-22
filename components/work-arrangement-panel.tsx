"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Edit3,
  Plus,
  Sparkles,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { KenyanSector, SECTOR_CONFIGS } from "@/lib/legal-engine";
import {
  createWorkArrangement,
  PAYMENT_BASES,
  PAYMENT_BASIS_LABELS,
  PaymentBasis,
  WorkArrangement,
} from "@/lib/work-arrangements";
import { SectorAgentResultSchema, type SectorAgentResult } from "@/lib/ai-contracts";
import { Button } from "@/components/ui/button";

interface WorkArrangementPanelProps {
  arrangements: WorkArrangement[];
  activeArrangementId?: string | null;
  onSelect: (id: string) => void;
  onSave: (arrangement: WorkArrangement) => void | Promise<void>;
  disabled?: boolean;
  lang?: "en" | "sw";
}

const SECTOR_LABELS: Record<KenyanSector, string> = {
  construction: "Construction & artisans",
  agriculture: "Agriculture & tea",
  domestic: "Domestic & care work",
  gig_delivery: "Gig delivery & boda boda",
};

type Draft = {
  label: string;
  sector: KenyanSector;
  paymentBasis: PaymentBasis;
  employerOrClient: string;
};

const EMPTY_DRAFT: Draft = {
  label: "",
  sector: "construction",
  paymentBasis: "unsure",
  employerOrClient: "",
};

function draftFromArrangement(arrangement?: WorkArrangement | null): Draft {
  if (!arrangement) return EMPTY_DRAFT;
  return {
    label: arrangement.label,
    sector: arrangement.sector,
    paymentBasis: arrangement.paymentBasis,
    employerOrClient: arrangement.employerOrClient || "",
  };
}

function suggestedDraft(result: SectorAgentResult, fallback: Draft): Draft {
  const fields = result.suggestedFields || {};
  const value = (key: string) => (typeof fields[key] === "string" ? fields[key] : "");
  const sector = value("sector");
  const paymentBasis = value("paymentBasis") || value("payment_basis");
  return {
    label: value("label") || value("arrangementLabel") || fallback.label || SECTOR_LABELS[result.sector],
    sector: (["construction", "agriculture", "domestic", "gig_delivery"] as string[]).includes(sector)
      ? (sector as KenyanSector)
      : result.sector,
    paymentBasis: (PAYMENT_BASES as readonly string[]).includes(paymentBasis)
      ? (paymentBasis as PaymentBasis)
      : fallback.paymentBasis,
    employerOrClient: value("employerOrClient") || value("employer") || value("client") || fallback.employerOrClient,
  };
}

export function WorkArrangementPanel({
  arrangements,
  activeArrangementId,
  onSelect,
  onSave,
  disabled = false,
  lang = "en",
}: WorkArrangementPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [description, setDescription] = useState("");
  const [suggestion, setSuggestion] = useState<SectorAgentResult | null>(null);
  const [suggestionState, setSuggestionState] = useState<"idle" | "loading" | "error">("idle");
  const [suggestionError, setSuggestionError] = useState("");
  const [saving, setSaving] = useState(false);

  const active = useMemo(
    () => arrangements.find((arrangement) => arrangement.id === activeArrangementId) || arrangements[0],
    [activeArrangementId, arrangements],
  );

  function openCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setDescription("");
    setSuggestion(null);
    setSuggestionState("idle");
    setSuggestionError("");
    setIsOpen(true);
  }

  function openEdit(arrangement: WorkArrangement) {
    setEditingId(arrangement.id);
    setDraft(draftFromArrangement(arrangement));
    setDescription("");
    setSuggestion(null);
    setSuggestionState("idle");
    setSuggestionError("");
    setIsOpen(true);
  }

  async function askAssistant() {
    if (description.trim().length < 8) {
      setSuggestionError(lang === "sw" ? "Eleza kazi yako kwa sentensi fupi." : "Tell us a little more about your work first.");
      return;
    }
    setSuggestionState("loading");
    setSuggestionError("");
    try {
      const response = await fetch("/api/ai/work-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: description.trim(), lang, intent: "setup", sector: draft.sector }),
      });
      const json = (await response.json()) as { agent?: unknown; result?: unknown } & Record<string, unknown>;
      const parsed = SectorAgentResultSchema.safeParse(json.agent ?? json.result ?? json);
      if (!response.ok || !parsed.success) throw new Error("The assistant could not return a safe suggestion.");
      setSuggestion(parsed.data);
      setDraft(suggestedDraft(parsed.data, draft));
      setSuggestionState("idle");
    } catch {
      setSuggestionState("error");
      setSuggestionError(lang === "sw" ? "Pendekezo halikupatikana. Unaweza kuweka mwenyewe." : "Suggestion unavailable. You can set this up manually.");
    }
  }

  function markUnsure() {
    setSuggestion(null);
    setSuggestionState("idle");
    setDraft((current) => ({ ...current, paymentBasis: "unsure" }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const label = draft.label.trim() || SECTOR_LABELS[draft.sector];
    setSaving(true);
    try {
      const existing = editingId ? arrangements.find((arrangement) => arrangement.id === editingId) : undefined;
      const arrangement = createWorkArrangement({
        ...existing,
        id: existing?.id,
        label,
        sector: draft.sector,
        paymentBasis: draft.paymentBasis,
        employerOrClient: draft.employerOrClient.trim() || undefined,
        confirmed: true,
      });
      await onSave(arrangement);
      onSelect(arrangement.id);
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="arrangement-panel" aria-labelledby="work-arrangements-title">
      <div className="arrangement-panel-heading">
        <div className="arrangement-panel-icon"><BriefcaseBusiness size={18} /></div>
        <div>
          <p className="arrangement-eyebrow">WORK CONTEXT</p>
          <h2 id="work-arrangements-title">Your work arrangements</h2>
          <p>Keep each job, client, or payment pattern separate. You can have more than one.</p>
        </div>
        <button type="button" className="arrangement-add" onClick={openCreate} aria-label="Add work arrangement" disabled={disabled}><Plus size={19} /></button>
      </div>

      {active ? (
        <div className="arrangement-switcher">
          <label htmlFor="active-work-arrangement">Active arrangement</label>
          <div className="arrangement-select-wrap">
            <select
              id="active-work-arrangement"
              value={active.id}
              onChange={(event) => onSelect(event.target.value)}
              disabled={disabled}
            >
              {arrangements.map((arrangement) => (
                <option key={arrangement.id} value={arrangement.id}>{arrangement.label}</option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </div>
          <button type="button" className="arrangement-edit" onClick={() => openEdit(active)} disabled={disabled}><Edit3 size={14} /> Edit</button>
        </div>
      ) : (
        <button type="button" className="arrangement-empty" onClick={openCreate} disabled={disabled}><Plus size={16} /> Tell us about your work</button>
      )}

      {active && (
        <div className="arrangement-meta" aria-live="polite">
          <span>{SECTOR_LABELS[active.sector]}</span>
          <span>{PAYMENT_BASIS_LABELS[active.paymentBasis]}</span>
          {active.employerOrClient && <span>{active.employerOrClient}</span>}
          <span className="arrangement-confirmed"><Check size={13} /> Confirmed by you</span>
        </div>
      )}

      {isOpen && (
        <div className="arrangement-modal-backdrop" role="presentation">
          <div className="arrangement-modal" role="dialog" aria-modal="true" aria-labelledby="arrangement-modal-title">
            <header className="arrangement-modal-header">
              <div className="arrangement-modal-mark"><BriefcaseBusiness size={20} /></div>
              <div><h3 id="arrangement-modal-title">{editingId ? "Edit work arrangement" : "Add a work arrangement"}</h3><p>This describes your work, not your social or legal status.</p></div>
              <button type="button" className="arrangement-close" onClick={() => setIsOpen(false)} aria-label="Close"><X size={19} /></button>
            </header>

            <div className="arrangement-modal-body">
              {!editingId && (
                <div className="arrangement-ai-box">
                  <div className="arrangement-ai-heading"><Sparkles size={16} /><strong>Tell us in your own words</strong><span>Optional</span></div>
                  <p>The assistant suggests context only. Nothing is saved until you confirm it.</p>
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="For example: I deliver parcels on a motorbike and receive payouts after platform fees…" maxLength={3000} />
                  <div className="arrangement-ai-footer"><small>{description.length}/3,000</small><Button type="button" variant="iosTinted" onClick={askAssistant} disabled={suggestionState === "loading"}>{suggestionState === "loading" ? "Thinking…" : "Suggest setup"}</Button></div>
                  {suggestionState === "error" && <p className="arrangement-error" role="alert">{suggestionError}</p>}
                </div>
              )}

              {suggestion && (
                <div className="arrangement-suggestion" aria-live="polite">
                  <div className="arrangement-suggestion-title"><span><Sparkles size={15} /> Suggested context</span><b>{suggestion.confidence} confidence</b></div>
                  <p>{suggestion.explanation || "Review these fields before saving."}</p>
                  {suggestion.assumptions.length > 0 && <div className="arrangement-assumptions"><TriangleAlert size={14} /><span>{suggestion.assumptions.join(" ")}</span></div>}
                  {suggestion.missingQuestions.length > 0 && <small>Still to clarify: {suggestion.missingQuestions.join(" · ")}</small>}
                  <div className="arrangement-review-actions"><Button type="button" variant="iosPrimary" onClick={() => setSuggestion(null)}><Check size={15} /> Confirm suggestion</Button><Button type="button" variant="iosPlain" onClick={() => setSuggestion(null)}><Edit3 size={15} /> Edit fields</Button><button type="button" onClick={markUnsure}>I’m unsure</button></div>
                </div>
              )}

              <form id="arrangement-form" className="arrangement-form" onSubmit={save}>
                <label><span>Arrangement name</span><input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="e.g. Karibu Builders or Office job" /></label>
                <label><span>Work sector</span><select value={draft.sector} onChange={(event) => setDraft({ ...draft, sector: event.target.value as KenyanSector })}>{Object.keys(SECTOR_CONFIGS).map((sector) => <option key={sector} value={sector}>{SECTOR_LABELS[sector as KenyanSector]}</option>)}</select></label>
                <label><span>How are you paid?</span><select value={draft.paymentBasis} onChange={(event) => setDraft({ ...draft, paymentBasis: event.target.value as PaymentBasis })}>{PAYMENT_BASES.map((basis) => <option key={basis} value={basis}>{PAYMENT_BASIS_LABELS[basis]}</option>)}</select></label>
                <label><span>Employer, client, or platform <i>Optional</i></span><input value={draft.employerOrClient} onChange={(event) => setDraft({ ...draft, employerOrClient: event.target.value })} placeholder="e.g. Employer name or M-Pesa client" /></label>
              </form>
            </div>
            <footer className="arrangement-modal-footer"><span><UserRound size={14} /> You can change this later</span><div><button type="button" className="arrangement-cancel" onClick={() => setIsOpen(false)}>Cancel</button><Button type="submit" form="arrangement-form" variant="iosPrimary" disabled={saving}>{saving ? "Saving…" : "Confirm and save"}</Button></div></footer>
          </div>
        </div>
      )}
    </section>
  );
}
